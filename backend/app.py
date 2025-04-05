from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from .upload_image import analyze_image

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/upload", methods=["POST"])
def upload_file():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files["image"]
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    result = analyze_image(file_path)
    return jsonify({"analysis": result})

if __name__ == "__main__":
    app.run(debug=True)
