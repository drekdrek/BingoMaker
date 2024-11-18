import json

import requests
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS

from data.disk_reader import read_text
from data.serialization import BoardEncoder
from game.game import Board


def create_app() -> Flask:
    app = Flask(__name__)

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/api/v1/bingocard/<tilesetId>")
    def generate_card(tilesetId):
        size = request.args.get("size", 5, type=int)
        board = Board(
            read_text("nouns"), size=size, free_square=False, seed=int(tilesetId)
        )
        board.id = str(tilesetId)
        return jsonify(json.loads(json.dumps(board, cls=BoardEncoder)))

    @app.route("/tilesets")
    def tilesets():
        #response = requests.get("api/v1/tilesets")
        #tilesets = response.json()
        return render_template('tilesets.html', tilesets=tilesets)

    return app
