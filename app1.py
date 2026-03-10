from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import openai
from dotenv import load_dotenv

# ----------------------------
# Load API key from .env
# ----------------------------
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")  # Ensure your .env has OPENAI_API_KEY=sk-xxxx

app = Flask(__name__)
# Allow requests from React frontend
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# ----------------------------
# Chatbot endpoint
# ----------------------------
@app.route("/chat", methods=["POST"])
def chat():
    try:
        user_input = request.json.get("message", "").strip()
        if not user_input:
            return jsonify({"response": ["Please ask something!"]})

        # GPT-5 Nano API call
        response = openai.Responses.create(
            model="gpt-5-nano",
            input=[
                {"role": "user", "content": [{"type": "input_text", "text": user_input}]}
            ]
        )

        # Extract AI response text
        result_text = ""
        if "output" in response:
            for item in response["output"]:
                if "content" in item:
                    for c in item["content"]:
                        if "text" in c:
                            result_text += c["text"]

        # Fallback if empty
        if not result_text.strip():
            result_text = "Sorry, I could not understand. Can you rephrase?"

        return jsonify({"response": [result_text]})

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"response": ["Server error. Try again."]}), 500

# ----------------------------
# Test route
# ----------------------------
@app.route("/", methods=["GET"])
def index():
    return "Chatbot backend is running!"

# ----------------------------
if __name__ == "__main__":
    print("✅ API KEY loaded:", bool(openai.api_key))
    app.run(debug=True)