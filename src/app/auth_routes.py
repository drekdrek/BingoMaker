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
