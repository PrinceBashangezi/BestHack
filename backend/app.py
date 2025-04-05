from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
import json
import datetime
from .infer import analyze_image  # Remove the dot (.) from the import

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
RESULTS_FOLDER = "results"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)

# DeepSeek API configuration
DEEPSEEK_API_KEY = "sk-67a3617416234fdb945ce5e5b7732eaf"
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"

def get_nutritional_analysis(vision_results):
    """Use DeepSeek API to analyze the nutritional content of the detected food"""
    
    # Extract relevant food information from Azure's results
    food_tags = [tag["name"] for tag in vision_results["tags"] if tag["confidence"] > 0.7]
    food_objects = [obj["object"] for obj in vision_results["objects"] if obj["confidence"] > 0.5]
    food_description = vision_results["description"]["captions"][0]["text"] if vision_results["description"]["captions"] else ""
    
    # Combine all detected food items
    all_food_items = list(set(food_tags + food_objects))
    
    # Construct prompt for DeepSeek
    prompt = f"""
    You are a nutritional expert analyzing food images for a health app. 
    Based on the following information from a food image, provide a detailed nutritional analysis:
    
    Food description: {food_description}
    Detected food items: {', '.join(all_food_items)}
    
    Please include:
    1. Estimated calories (range is fine if uncertain)
    2. Macronutrient breakdown (protein, carbs, fat)
    3. Key vitamins and minerals present
    4. Health benefits of the detected foods
    5. Any potential allergens or dietary concerns
    6. Simple recommendations for making this meal healthier
    
    Format your response as a structured JSON object with these sections.
    """
    
    # Call DeepSeek API directly with requests
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "You are a nutritional expert assistant."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 1000
    }
    
    try:
        response = requests.post(DEEPSEEK_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        
        # Extract the AI response
        ai_response = result["choices"][0]["message"]["content"]
        
        # Try to parse JSON from the response if it's formatted correctly
        try:
            # Check if the response contains JSON wrapped in markdown code blocks
            if "```json" in ai_response:
                # Extract the JSON part from the markdown code block
                json_part = ai_response.split("```json")[1].split("```")[0].strip()
                return json.loads(json_part)
            else:
                return json.loads(ai_response)
        except json.JSONDecodeError:
            # If we can't parse JSON, return the raw text
            return {"analysis_text": ai_response}
            
    except Exception as e:
        return {"error": f"DeepSeek API error: {str(e)}"}

def save_analysis_to_file(image_name, analysis_data):
    """Save the analysis results to a JSON file"""
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    # Use original image filename without extension + timestamp
    base_name = os.path.splitext(image_name)[0]
    filename = f"{base_name}_{timestamp}.json"
    filepath = os.path.join(RESULTS_FOLDER, filename)
    
    with open(filepath, 'w') as f:
        json.dump(analysis_data, f, indent=4)
    
    return filename

@app.route("/upload", methods=["POST"])
def upload_file():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files["image"]
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    # Get basic image analysis from Azure
    vision_result = analyze_image(file_path)
    
    # Get enhanced nutritional analysis from DeepSeek
    nutrition_result = get_nutritional_analysis(vision_result)
    
    # Combine results
    full_analysis = {
        "vision_analysis": vision_result,
        "nutrition_analysis": nutrition_result
    }
    
    # Save analysis to a JSON file
    saved_filename = save_analysis_to_file(file.filename, full_analysis)
    
    # Return combined results along with saved file information
    response = {
        "vision_analysis": vision_result,
        "nutrition_analysis": nutrition_result,
        "saved_to_file": saved_filename
    }
    
    return jsonify(response)

if __name__ == "__main__":
    app.run(debug=True)