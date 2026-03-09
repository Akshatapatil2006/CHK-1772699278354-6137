from flask import Flask, request, jsonify
from flask_cors import CORS
from difflib import get_close_matches
import json
import os

app = Flask(__name__)
CORS(app)

# Load sustainability knowledge base
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(BASE_DIR, "sustainability_data.json")
with open(JSON_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

# Map user query keywords to JSON fields
INTENT_MAP = {
    "definition": ["definition", "meaning", "what is"],
    "importance": ["importance", "why"],
    "objectives": ["objective", "goal", "aim"],
    "examples": ["example", "examples", "like"],
    "facts": ["fact", "facts", "information", "info"],
    "tips": ["tip", "tips", "how", "guide"],
    "problems": ["problem", "issue", "challenge"],
    "solutions": ["solution", "solutions", "how to", "way", "method", "practice"],
    "reduce": ["reduce", "cut", "lessen"],
    "reuse": ["reuse", "repurpose", "recycle again", "use again", "how to reuse"],
    "recycle": ["recycle", "recycling"],
    "causes": ["cause", "reason", "why"],
    "effects": ["effect", "impact", "result", "consequence"],
    "benefits": ["benefit", "advantage", "gain"],
    "activities": ["activity", "activities", "things to do", "practice", "actions"]
}

# Greetings
GREETINGS = ["hi", "hello", "hey", "good morning", "good evening"]

# Context per user IP
user_context = {}

# Helper: format topic content
def format_topic(topic, fields=None):
    response = []
    if fields:
        for f in fields:
            if f in topic:
                content = topic[f]
                if isinstance(content, list):
                    content = ", ".join(content)
                response.append(f"{f.capitalize()}: {content}")
    else:
        for key, value in topic.items():
            if isinstance(value, list):
                value = ", ".join(value)
            response.append(f"{key.capitalize()}: {value}")
    return response

# Determine relevant fields for a user query
def get_relevant_fields(user_input, topic):
    user_input = user_input.lower()

    # Explicit SDG check
    if "sdg" in user_input or "sustainable development goal" in user_input or "17 goals" in user_input:
        if "sdgs" in topic:
            return ["sdgs"]

    # Normal intent mapping
    for field, keywords in INTENT_MAP.items():
        if any(kw in user_input for kw in keywords) and field in topic:
            return [field]

    # Default: return full topic
    return None

# Find the best topic based on user input
def find_best_topic(user_input):
    user_input = user_input.lower()
    # Exact match
    if user_input in data:
        return user_input
    # Keyword match in topic keys
    for key in data:
        if key in user_input or user_input in key:
            return key
    # Fuzzy match
    matches = get_close_matches(user_input, data.keys(), n=1, cutoff=0.5)
    if matches:
        return matches[0]
    return None

@app.route("/chat", methods=["POST"])
def chatbot():
    try:
        req = request.get_json()
        user_input = req.get("message", "").strip().lower()
        if not user_input:
            return jsonify({"response": ["Please ask something about sustainability."]})

        # User session
        session_id = req.get("session_id", "default_session")
        if session_id not in user_context:
            user_context[session_id] = {"last_topic": None, "topics": []}

        # Greetings
        if any(greet in user_input for greet in GREETINGS):
            return jsonify({"response": ["Hello! 🌱 I am EcoBot. Ask me about sustainability, recycling, reuse, composting, waste management, or SDGs."]})

        # Detect topic
        topic_key = find_best_topic(user_input)
        if topic_key:
            topic = data[topic_key]
            user_context[session_id]["last_topic"] = topic_key
            user_context[session_id]["topics"].append(topic_key)

            fields = get_relevant_fields(user_input, topic)
            response_chunks = format_topic(topic, fields)
            if not response_chunks:
                response_chunks = format_topic(topic)  # fallback
            return jsonify({"response": response_chunks})
        else:
            # Fallback: last topic if available
            last_topic = user_context[session_id].get("last_topic")
            if last_topic:
                topic = data[last_topic]
                response_chunks = format_topic(topic)
                return jsonify({"response": response_chunks})

        # Default fallback
        return jsonify({
            "response": ["I am EcoBot 🌱 Ask me about sustainability, recycling, reuse, composting, waste management, or SDGs."]
        })

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"response": ["Server error. Try again."]}), 500

if __name__ == "__main__":
    app.run(debug=True)