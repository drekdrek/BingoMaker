import boto3
from flask import Blueprint, Flask, redirect
from flask_cognito_lib import CognitoAuth
from flask_cognito_lib.decorators import (
    cognito_login,
    cognito_login_callback,
    cognito_logout,
    cognito_refresh_callback,
)

bp = Blueprint("auth", __name__)


def cognito_app(app: Flask):
    if not app.config["TESTING"]:
        _client = boto3.client("secretsmanager", region_name=app.config["AWS_REGION"])
        app.config["AWS_COGNITO_USER_POOL_CLIENT_SECRET"] = _client.get_secret_value(
            SecretId="CognitoUserPoolClientSecret"
        )["SecretString"]
        app.config["AWS_COGNITO_USER_POOL_CLIENT_ID"] = _client.get_secret_value(
            SecretId="CognitoUserPoolClientId"
        )["SecretString"]
        app.config["AWS_COGNITO_USER_POOL_ID"] = _client.get_secret_value(
            SecretId="CognitoUserPoolId"
        )["SecretString"]
    return CognitoAuth(app)


@bp.get("/login")
@cognito_login
def login():
    pass


@bp.get("/postlogin")
@cognito_login_callback
def post_login():
    return redirect("/")


@bp.get("/logout")
@cognito_logout
def logout():
    return "Logged out"


@bp.get("/postlogout")
def post_logout():
    return "Logged out"


@bp.get("/refresh")
@cognito_refresh_callback
def refresh():
    return "Refreshed"
