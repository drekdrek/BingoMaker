#! /usr/bin/env bash

# This script deploys all the components of the BingoMaker App in AWS.
export PAGER=cat

S3_BUCKET_NAME="cs399-bingo-maker-app"
AWS_REGION="us-east-1"
COGNITO_DOMAIN_PREFIX="bingo-maker-cs399"
DYNAMODB_TABLE_NAME="BingoMaker"
COGNITO_POOL_NAME="BingoMaker"


#list all vpcs and select the first one
VPC_ID=$(aws ec2 describe-vpcs --query "Vpcs[0].VpcId" --output text)

echo "VPC ID: $VPC_ID"

echo -n "Security Group ID: "
# check if security group exists, if not create it
if aws ec2 describe-security-groups --filters Name=tag:purpose,Values=bingo-maker --query "SecurityGroups[0].GroupId" --output text | grep -q "None"; then
    aws ec2 create-security-group --group-name "bingo-maker-ec2" --description "Allow http(s), ssh, and database access" \
        --vpc-id $VPC_ID \
        --query "GroupId" --output text \
        --tag-specifications '{"ResourceType":"security-group","Tags":[{"Key":"purpose","Value":"bingo-maker"},{"Key":"lifespan","Value":"indeterminate"}]}'
fi

SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --filters Name=tag:purpose,Values=bingo-maker --query "SecurityGroups[0].GroupId" --output text)


if ! aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID \
    --ip-permissions '{"FromPort":22,"ToPort":22,"IpProtocol":"tcp","IpRanges":[{"CidrIp":"0.0.0.0/0"}]}' '{"FromPort":80,"ToPort":80,"IpProtocol":"tcp","IpRanges":[{"CidrIp":"0.0.0.0/0"}]}' '{"FromPort":443,"ToPort":443,"IpProtocol":"tcp","IpRanges":[{"CidrIp":"0.0.0.0/0"}]}' | grep -q "already exists"; then
    echo "Successfully added ingress rules to security group"
else
    echo "ingress rules already exist"
fi
# allow access to port 22 (ssh), 80 (http), and 443 (https)


# create the ec2 instance
echo "Creating EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances --image-id "ami-06b21ccaeff8cd686" --instance-type "t2.micro" \
    --key-name "vockey" --network-interfaces "[{\"AssociatePublicIpAddress\":true,\"DeviceIndex\":0,\"Groups\":[\"$SECURITY_GROUP_ID\"]}]" \
    --tag-specifications '{"ResourceType":"instance","Tags":[{"Key":"Name","Value":"bingo-maker"}]}' \
    --private-dns-name-options '{"HostnameType":"ip-name","EnableResourceNameDnsARecord":true,"EnableResourceNameDnsAAAARecord":false}' \
    --user-data file://deploy/userdata.sh \
    --count "1" \
    --iam-instance-profile '{"Arn": "arn:aws:iam::620401114971:instance-profile/LabInstanceProfile" }' \
    --query "Instances[*].InstanceId" \
    --output text
)

# echo "Associating IAM Instance Profile..."
# aws ec2 associate-iam-instance-profile --instance-id $INSTANCE_ID --iam-instance-profile '{"Name": "LabRole" }'

echo "EC2 instance created with ID: $INSTANCE_ID"

INSTANCE_IP_ADDR=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[*].Instances[*].PublicIpAddress' --output text)




# make a DynamoDB table for the BingoMaker App
# if the table already exists, it will be skipped
aws dynamodb create-table --table-name $DYNAMODB_TABLE_NAME --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 --region $AWS_REGION > /dev/null


# create an S3 Bucket for the BingoMaker App

aws s3api create-bucket --bucket $S3_BUCKET_NAME --region $AWS_REGION > /dev/null

# create cognito 
echo "Creating Cognito User Pool..."
USER_POOL_ID=$(aws cognito-idp create-user-pool \
    --region $AWS_REGION \
    --pool-name $COGNITO_POOL_NAME \
    --policies 'PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=true}' \
    --auto-verified-attributes email \
    --schema '[
        {"Name":"email","AttributeDataType":"String","DeveloperOnlyAttribute":false,"Mutable":true,"Required":true},
        {"Name":"name","AttributeDataType":"String","DeveloperOnlyAttribute":false,"Mutable":true,"Required":false}
    ]' \
    --alias-attributes email \
    --username-configuration "CaseSensitive=false" \
    --admin-create-user-config AllowAdminCreateUserOnly=false \
    --query 'UserPool.Id' --output text)

echo "Creating Cognito User Pool Domain..."
aws cognito-idp create-user-pool-domain \
    --domain $COGNITO_DOMAIN_PREFIX \
    --user-pool-id $USER_POOL_ID \
    --region $AWS_REGION


AWS_COGNITO_REDIRECT_URL=https://bingo.drek.cloud/postlogin

echo "Updating Cognito User Pool Client..."
OUTPUT=$(aws cognito-idp create-user-pool-client \
    --user-pool-id $USER_POOL_ID \
    --region $AWS_REGION \
    --client-name flask \
    --allowed-o-auth-flows implicit \
    --allowed-o-auth-scopes openid email profile \
    --supported-identity-providers COGNITO \
    --token-validity-units AccessToken=minutes,IdToken=minutes,RefreshToken=days \
    --read-attributes email name \
    --write-attributes email name \
    --prevent-user-existence-errors ENABLED \
    --explicit-auth-flows ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH \
    --allowed-o-auth-flows code \
    --allowed-o-auth-flows-user-pool-client \
    --callback-urls $AWS_COGNITO_REDIRECT_URL \
    --generate-secret
)

AWS_COGNITO_USER_POOL_CLIENT_ID=$(echo $OUTPUT | jq -r '.UserPoolClient.ClientId')
AWS_COGNITO_USER_POOL_CLIENT_SECRET=$(echo $OUTPUT | jq -r '.UserPoolClient.ClientSecret')

echo "AWS_COGNITO_USER_POOL_CLIENT_ID: $AWS_COGNITO_USER_POOL_CLIENT_ID"
echo "AWS_COGNITO_USER_POOL_CLIENT_SECRET: $AWS_COGNITO_USER_POOL_CLIENT_SECRET"
echo "AWS_COGNITO_USER_POOL_ID: $USER_POOL_ID"

# put the user_pool_id, client_id, and client_secret in secrets manager
echo "Putting Cognito User Pool Client ID and Secret in Secrets Manager..."
aws secretsmanager create-secret --name CognitoUserPoolClientSecret --secret-string $AWS_COGNITO_USER_POOL_CLIENT_SECRET
aws secretsmanager create-secret --name CognitoUserPoolClientId --secret-string $AWS_COGNITO_USER_POOL_CLIENT_ID
aws secretsmanager create-secret --name CognitoUserPoolId --secret-string $USER_POOL_ID


echo "EC2 instance created with IP address: $INSTANCE_IP_ADDR"