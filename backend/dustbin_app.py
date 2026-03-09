from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Dummy dustbin data (later database replace)
dustbins = [
    {
        "id": "BIN1",
        "location": "College Gate",
        "lat": 18.5204,
        "lng": 73.8567,
        "fill": 90
    },
    {
        "id": "BIN2",
        "location": "Parking Area",
        "lat": 18.5220,
        "lng": 73.8585,
        "fill": 45
    }
]

@app.route("/bins", methods=["GET"])
def get_bins():
    return jsonify(dustbins)


@app.route("/update_bin", methods=["POST"])
def update_bin():

    data = request.json

    for bin in dustbins:
        if bin["id"] == data["id"]:
            bin["fill"] = data["fill"]

    return jsonify({"message": "updated"})


if __name__ == "__main__":
    app.run(port=5000, debug=True)