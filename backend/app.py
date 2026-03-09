# app.py
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from predict import predict_waste

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/")
def home():
    return "Backend Running 🚀"

@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]  # <-- key match with frontend
    path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(path)

    waste, bin_type = predict_waste(path)

    return jsonify({
        "waste_type": waste,
        "dustbin": bin_type
    })

if __name__ == "__main__":
    app.run(debug=True)



    