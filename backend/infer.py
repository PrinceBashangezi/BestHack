from inference_sdk import InferenceHTTPClient
import json
import os

# Roboflow credentials
CLIENT = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key="rf_UHOSCWxlPbUjrpm3I92G1puYqZm1"
)

# Image path (adjust as needed)
image_path = "uploads/food.jpg"

# Model ID from your Roboflow project/version
model_id = "food-imgae-yolo/2"  # fix spelling if needed

# Run inference
result = CLIENT.infer(image_path, model_id=model_id)

# Save result to file
output_path = os.path.join(os.path.dirname(image_path), "roboflow_results.json")
with open(output_path, "w") as f:
    json.dump(result, f, indent=2)

print(f"Saved Roboflow result to {output_path}")
