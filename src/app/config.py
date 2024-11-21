import os

import boto3

from data import DynamoTilePoolDB, FileTilePoolDB, MemoryTilePoolDB
from images import (
    LocalImageManager,
    LocalReferenceCounts,
    MemoryReferenceCounts,
    S3ImageManager,
)


class Config:
    TESTING = False
    DEBUG = False
    SECRET_KEY = "07c56596b48f48b3a749a6969e64fadc"

    @property
    def DB(self):
        raise NotImplementedError("No Tile Pool Database defined for this config")

    @property
    def IMAGES(self):
        raise NotImplementedError("Not Image Manager defined for this config")


class DebugConfig(Config):
    DEBUG = True

    @property
    def DB(self):
        return FileTilePoolDB("debug_tiles")

    @property
    def IMAGES(self):
        return LocalImageManager("debug_image_store", LocalReferenceCounts("debug_counts"))


class TestingConfig(Config):
    DEBUG = True

    @property
    def DB(self):
        return MemoryTilePoolDB()

    @property
    def IMAGES(self):
        return LocalImageManager("testing_image_store", MemoryReferenceCounts())


class LocalDiskConfig(Config):
    @property
    def DB(self):
        return FileTilePoolDB("tiles")

    @property
    def IMAGES(self):
        return LocalImageManager("image_store", LocalReferenceCounts("counts"))


class LocalAWSConfig(Config):
    @property
    def DB(self):
        return DynamoTilePoolDB(endpoint_url="http://localhost.localstack.cloud:4566")

    @property
    def IMAGES(self):
        return S3ImageManager(
            "bingo-maker",
            LocalReferenceCounts("counts"),
            endpoint_hostname="localhost.localstack.cloud:4566",
        )


class CloudAWSConfig(Config):
    AWS_REGION = "us-east-1"
    _client = boto3.client("secretsmanager", region_name=AWS_REGION)
    AWS_COGNITO_DOMAIN = "https://bingomaker.auth.us-east-1.amazoncognito.com"
    AWS_COGNITO_REDIRECT_URL = "https://bingo.drek.cloud/postlogin"
    AWS_COGNITO_LOGOUT_URL = "https://bingo.drek.cloud/postlogout"
    AWS_COGNITO_REFRESH_FLOW_ENABLED = True
    AWS_COGNITO_REFRESH_COOKIE_ENCRYPTED = True
    AWS_COGNITO_REFRESH_COOKIE_AGE_SECONDS = 86400
    AWS_COGNITO_USER_POOL_CLIENT_SECRET = _client.get_secret_value(
        SecretId="CognitoUserPoolClientSecret"
    )["SecretString"]
    AWS_COGNITO_USER_POOL_CLIENT_ID = _client.get_secret_value(SecretId="CognitoUserPoolClientId")[
        "SecretString"
    ]
    AWS_COGNITO_USER_POOL_ID = _client.get_secret_value(SecretId="CognitoUserPoolId")[
        "SecretString"
    ]

    @property
    def DB(self):
        return DynamoTilePoolDB()

    @property
    def IMAGES(self):
        return S3ImageManager(os.environ["S3_BUCKET_NAME"], LocalReferenceCounts("counts"))
