#! /usr/bin/env bash
export PAGER=cat


# remove all the resources created by the deploy script
S3_BUCKET_NAME="cs399-bingo-maker-app"
AWS_REGION="us-east-1"
COGNITO_DOMAIN_PREFIX="bingo-maker-cs399"
DYNAMODB_TABLE_NAME="BingoMaker"
COGNITO_POOL_NAME="BingoMaker"
#get the instance id
INSTANCE_ID=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=bingo-maker" "Name=instance-state-name,Values=running" \
    --query "Reservations[*].Instances[*].InstanceId" \
    --output text)

# remove the ec2 instance
echo "Terminating EC2 instance..."
aws ec2 terminate-instances --instance-ids $INSTANCE_ID

# remove the s3 bucket
echo "Deleting S3 Bucket..."
aws s3api delete-bucket --bucket $S3_BUCKET_NAME

# get the userpool id

COGNITO_USER_POOL_ID=$(aws cognito-idp list-user-pools --max-results=5 --output json | \
                       jq -r --arg POOL_NAME "$COGNITO_POOL_NAME" \
                       '.UserPools[] | select(.Name == $POOL_NAME) | .Id')


#get the cognito user pool client id
COGNITO_USER_POOL_CLIENT_ID=$(aws cognito-idp list-user-pool-clients --user-pool-id $COGNITO_USER_POOL_ID --max-results=5 --output json | \
                       jq -r --arg CLIENT_NAME "flask" '.UserPoolClients[] | select(.ClientName == $CLIENT_NAME) | .ClientId')


# remove the cognito user pool
echo "Deleting Cognito User Pool Client..."
aws cognito-idp delete-user-pool-client --user-pool-id $COGNITO_USER_POOL_ID --client-id $COGNITO_USER_POOL_CLIENT_ID
echo "Deleting Cognito User Pool Domain..."
aws cognito-idp delete-user-pool-domain --domain $COGNITO_DOMAIN_PREFIX --user-pool-id $COGNITO_USER_POOL_ID
echo "Deleting Cognito User Pool..."
aws cognito-idp delete-user-pool --user-pool-id $COGNITO_USER_POOL_ID


# remove the dynamodb table
echo "Deleting DynamoDB Table..."
aws dynamodb delete-table --table-name $DYNAMODB_TABLE_NAME



# If INSTANCE_ID is empty, print a message and skip the loop
if [ -z "$INSTANCE_ID" ]; then
    echo "No running EC2 instance found with the tag 'Name=bingo-maker'."
else
    echo "Found running EC2 instance with ID: $INSTANCE_ID"

    echo "Waiting for the EC2 instance to terminate..."
    while true; do
        # Get the current state of the instance
        INSTANCE_STATE=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --query "Reservations[0].Instances[0].State.Name" --output text)

        echo "Current state: $INSTANCE_STATE"

        # Check if the instance is terminated
        if [ "$INSTANCE_STATE" == "terminated" ]; then
            echo "EC2 instance has been terminated."
            break
        fi

        # Wait for 5 seconds before checking again
        sleep 5
    done
fi
# get the security group id
SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --filters Name=tag:purpose,Values=bingo-maker --query "SecurityGroups[0].GroupId" --output text)
echo "Deleting Security Group..."
# remove the security group
aws ec2 delete-security-group --group-id $SECURITY_GROUP_ID


# remove the secrets in secrets manager
echo "Deleting Secrets Manager Secrets..."
aws secretsmanager delete-secret --force-delete-without-recovery --secret-id CognitoUserPoolClientSecret
aws secretsmanager delete-secret --force-delete-without-recovery --secret-id CognitoUserPoolClientId
aws secretsmanager delete-secret --force-delete-without-recovery --secret-id CognitoUserPoolId