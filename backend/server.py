from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# Initial bins
bins = [
    {"id": 1, "name": "Gate Bin", "lat": 18.5225, "lng": 73.8570, "filled": 30},
    {"id": 2, "name": "Canteen Bin", "lat": 18.5180, "lng": 73.8600, "filled": 60},
    {"id": 3, "name": "Parking Bin", "lat": 18.5190, "lng": 73.8520, "filled": 20},
]

# REST API: get all bins
@app.route("/bins", methods=["GET"])
def get_bins():
    return jsonify(bins)

# REST API: add new bin (admin)
@app.route("/add_bin", methods=["POST"])
def add_bin():
    data = request.json
    new_id = max([b["id"] for b in bins]) + 1 if bins else 1
    new_bin = {
        "id": new_id,
        "name": data["name"],
        "lat": data["lat"],
        "lng": data["lng"],
        "filled": data.get("filled", 0)
    }
    bins.append(new_bin)
    socketio.emit("update_bins", bins)
    return jsonify({"status": "success", "bin": new_bin})

# REST API: update filled %
@app.route("/update_bin/<int:bin_id>", methods=["POST"])
def update_bin(bin_id):
    data = request.json
    for b in bins:
        if b["id"] == bin_id:
            b["filled"] = data.get("filled", b["filled"])
            socketio.emit("update_bins", bins)
            return jsonify({"status": "success", "bin": b})
    return jsonify({"status": "error", "message": "Bin not found"}), 404

# Socket.IO: send bins on connect
@socketio.on("connect")
def handle_connect():
    emit("update_bins", bins)

if __name__ == "__main__":
    print("Flask Socket.IO server running on http://127.0.0.1:5000")
    socketio.run(app, host="127.0.0.1", port=5000, debug=True)