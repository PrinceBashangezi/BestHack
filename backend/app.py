from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
import json
import datetime
from infer import analyze_image  # Remove the dot (.) from the import
from PIL import Image
import io

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

@app.route("/", methods=["GET"])
def home():
    return "Flask app is running and reachable via ngrok!"

def resize_image(file_path, max_size=800):
    """Resize an image to reduce file size while maintaining aspect ratio"""
    try:
        img = Image.open(file_path)
        
        # Get original dimensions
        width, height = img.size
        
        # Calculate new dimensions while maintaining aspect ratio
        if width > height:
            if width > max_size:
                new_width = max_size
                new_height = int(height * (max_size / width))
        else:
            if height > max_size:
                new_height = max_size
                new_width = int(width * (max_size / height))
            else:
                new_width, new_height = width, height
        
        # Resize image and save back to same path
        if width > max_size or height > max_size:
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            img.save(file_path, optimize=True, quality=85)
            print(f"Image resized to {new_width}x{new_height}")
        
        return True
    except Exception as e:
        print(f"Error resizing image: {str(e)}")
        return False

@app.route("/upload", methods=["POST"])
def upload_file():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image provided"}), 400

        file = request.files["image"]
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)
        
        # Resize image before processing
        resize_image(file_path)

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
        
        # Return combined results
        response = {
            "vision_analysis": vision_result,
            "nutrition_analysis": nutrition_result,
            "saved_to_file": saved_filename
        }
        
        return jsonify(response)
    except Exception as e:
        import traceback
        print(f"Error in upload_file: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
    
# Add this new function to process menu items

# Replace the existing analyze_menu function with this improved version:

def analyze_menu(vision_results, user_preferences=None):
    """Use DeepSeek API to analyze a menu and make recommendations"""
    
    # Extract text from the vision results
    detected_text = " ".join([tag["name"] for tag in vision_results["tags"] if "text" in tag["name"].lower()])
    detected_items = vision_results["description"]["captions"][0]["text"] if vision_results["description"]["captions"] else ""
    
    # Check if OCR results are available
    extracted_text = vision_results.get("read_text", "")
    
    # If we have OCR results, use them instead of tags
    if extracted_text:
        detected_text = extracted_text
    
    # Use the confidence values to determine if this is actually a menu
    menu_related_tags = ["menu", "restaurant", "food", "dining", "dish", "meal"]
    is_menu = False
    
    # Check if any menu-related tags are detected with reasonable confidence
    for tag in vision_results["tags"]:
        if any(menu_term in tag["name"].lower() for menu_term in menu_related_tags) and tag["confidence"] > 0.65:
            is_menu = True
            break
            
    # If description contains clear menu indications
    if any(term in detected_items.lower() for term in menu_related_tags):
        is_menu = True
    
    # If no menu is detected, return early with an error message
    if not is_menu or (not detected_text and not detected_items):
        return {
            "error": "No menu detected in the image. Please take a photo of a food menu.",
            "recommendations": [],
            "items_to_avoid": []
        }
    
    # Default preferences if none provided
    if not user_preferences:
        user_preferences = {
            "age": 30,
            "height": 170,
            "weight": 70,
            "dietary_restrictions": [],
            "health_goals": "balanced",
            "calories_target": "moderate"
        }
    
    # Construct prompt for DeepSeek, emphasizing to only recommend items from the actual menu text
    prompt = f"""
    You are a nutritional expert analyzing a restaurant menu for a health app.
    Based on the following information detected from a menu image, provide personalized recommendations:
    
    Menu text/description: {detected_text} {detected_items}
    
    User information:
    -age: {user_preferences['age']}  
    - Height: {user_preferences['height']} 
    - Weight: {user_preferences['weight']} pounds
    - Dietary restrictions: {', '.join(user_preferences['dietary_restrictions']) if user_preferences['dietary_restrictions'] else 'None'}
    - Health goals: {user_preferences['health_goals']}
    - Calorie target: {user_preferences['calories_target']}
    
    IMPORTANT: ONLY recommend dishes that are explicitly mentioned in the menu text above.
    If you don't see any specific food items in the menu text, respond with an empty recommendations list.
    Do not invent or assume menu items that aren't clearly visible in the text.
    
    Please provide:
    1. A list of recommended menu items that align with the user's preferences (only from items actually visible in the menu)
    2. For each recommendation, explain why it's a good choice
    3. Suggestions for modifications to make the dish healthier (e.g., dressing on the side)
    4. Menu items to avoid based on the user's preferences and health goals (only from items actually visible in the menu)
    
    Format your response as a structured JSON object with these sections.
    If no clear menu items are detected, return empty arrays for recommendations and items_to_avoid.
    """
    
    # Call DeepSeek API directly with requests
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "You are a nutritional expert and menu advisor. Only recommend items that are explicitly mentioned in the menu text."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.5,  # Lower temperature for more focused responses
        "max_tokens": 1000
    }
    
    try:
        response = requests.post(DEEPSEEK_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        
        # Extract the AI response
        ai_response = result["choices"][0]["message"]["content"]
        
        # Try to parse JSON from the response
        try:
            if "```json" in ai_response:
                json_part = ai_response.split("```json")[1].split("```")[0].strip()
                parsed_response = json.loads(json_part)
            else:
                parsed_response = json.loads(ai_response)
                
            # Add a "menu_detected" flag to the response
            parsed_response["menu_detected"] = is_menu
            
            # If empty recommendations but menu detected, add explanation
            if is_menu and (not parsed_response.get("recommendations") or len(parsed_response.get("recommendations", [])) == 0):
                parsed_response["note"] = "Menu detected, but no specific food items could be identified."
                
            return parsed_response
                
        except json.JSONDecodeError:
            return {
                "menu_detected": is_menu,
                "analysis_text": ai_response,
                "recommendations": [],
                "items_to_avoid": []
            }
            
    except Exception as e:
        return {
            "error": f"DeepSeek API error: {str(e)}",
            "menu_detected": is_menu,
            "recommendations": [],
            "items_to_avoid": []
        }

# Add this new route for menu analysis
@app.route("/analyze_menu", methods=["POST"])
def menu_recommendation():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No menu image provided"}), 400

        file = request.files["image"]
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)
        
        # Resize image before processing
        resize_image(file_path)

        # Get basic image analysis from Azure
        vision_result = analyze_image(file_path)
        
        # Get user preferences from request if provided
        user_preferences = request.form.get("preferences", "{}")
        try:
            preferences_dict = json.loads(user_preferences)
        except:
            preferences_dict = {}
        
        # Get menu recommendations
        menu_recommendations = analyze_menu(vision_result, preferences_dict)
        
        # Combine results
        full_analysis = {
            "vision_analysis": vision_result,
            "menu_recommendations": menu_recommendations
        }
        
        # Save analysis to a JSON file
        saved_filename = save_analysis_to_file(file.filename, full_analysis)
        
        return jsonify(full_analysis)
    except Exception as e:
        import traceback
        print(f"Error in menu_recommendation: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False, use_reloader=False)
