import json

from flask import Flask, jsonify, request

from game import _example_game, Board
from serialization import BoardEncoder
from disk_reader import read_text

app = Flask(__name__)


@app.route("/")
def hello_world():
    return "<p>Hello World</p>"


@app.route("/api/v1/bingocard/<tilesetId>")
def generate_card(tilesetId):
    size = request.args.get("size", 5, type=int)
    # excluded_tags = request.args.get("excluded_tags")
    board = Board(read_text("nouns"), size=size, free_square=False)
    board.id = str(tilesetId)
    # HACK: serializing and deserializing is done to use jsonify on a dict
    return jsonify(json.loads(json.dumps(board, cls=BoardEncoder)))


if __name__ == "__main__":
    app.run(port=8080)
