from .app import aws_create_app, create_app  # noqa: F401

if __name__ == "__main__":
    create_app().run(port=8080)
