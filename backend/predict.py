import requests
import base64
from dotenv import load_dotenv
import os
import json

# ----------------------------
# Load API key from .env
# ----------------------------
load_dotenv()
API_KEY = os.getenv("OPENAI_API_KEY")

print("✅ API KEY loaded:", bool(API_KEY))  # Debug check

# ----------------------------
# Function to predict waste
# ----------------------------
def predict_waste(image_path):
    if not API_KEY:
        print("❌ API Key not found. Check .env file")
        return "unknown", "unknown"

    # Convert image to Base64
    try:
        with open(image_path, "rb") as f:
            b64_image = base64.b64encode(f.read()).decode("utf-8")
    except Exception as e:
        print("Image read error:", e)
        return "unknown", "unknown"

    url = "https://api.openai.com/v1/responses"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }

    # Request payload (multimodal image + text)
    payload = {
        "model": "gpt-5-nano",   # fast + cheap model
        "input": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": (
                            "Classify this waste image and tell which dustbin it belongs to "
                            "(Plastic, Organic, Metal, Paper, Glass, General). "
                            "Respond only with waste type."
                        )
                    },
                    {
                        "type": "input_image",
                        "image_url": f"data:image/jpeg;base64,{b64_image}"
                    }
                ]
            }
        ]
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()

        result = response.json()
        print("✅ Full API Response:", json.dumps(result, indent=2))

        # ----------------------------
        # Safe response parsing
        # ----------------------------
        result_text = ""

        if "output" in result:
            for item in result["output"]:
                if "content" in item:
                    for c in item["content"]:
                        if "text" in c:
                            result_text += c["text"]

        result_text = result_text.lower()
        print("✅ Parsed AI Text:", result_text)

    except Exception as e:
        print("❌ API request failed:", e)
        return "unknown", "unknown"

    # ----------------------------
    # Waste → Dustbin mapping
    # ----------------------------
    if any(k in result_text for k in ["plastic", "polyethylene", "pet bottle"]):
        return "Plastic", "Blue"

    elif any(k in result_text for k in ["organic", "biodegradable", "food"]):
        return "Organic", "Green"

    elif any(k in result_text for k in ["metal", "aluminium", "steel"]):
        return "Metal", "Red"

    elif any(k in result_text for k in ["paper", "cardboard"]):
        return "Paper", "Blue"

    elif any(k in result_text for k in ["glass"]):
        return "Glass", "Blue"

    else:
        return "General", "Black"