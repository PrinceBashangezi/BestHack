from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from msrest.authentication import CognitiveServicesCredentials

def analyze_image(image_path):
    # Your Azure credentials
    subscription_key = "1gKnUaneC6lyNxtc9bhKeWLkI0HiBXy2KcaYrhuCaiFlJ1NQE6baJQQJ99BDAC4f1cMXJ3w3AAAFACOGN7or"
    endpoint = "https://5chack.cognitiveservices.azure.com/"
    
    # Create the Computer Vision client
    client = ComputerVisionClient(endpoint, CognitiveServicesCredentials(subscription_key))
    
    # Analyze the image
    with open(image_path, "rb") as image_stream:
        analysis = client.analyze_image_in_stream(
            image=image_stream,
            visual_features=["Tags", "Objects", "Description"]
        )
    
    # Convert to dictionary format for JSON response
    result = {
        "tags": [{"name": tag.name, "confidence": tag.confidence} for tag in analysis.tags],
        "objects": [{"object": obj.object_property, "confidence": obj.confidence} for obj in analysis.objects],
        "description": {
            "captions": [{"text": caption.text, "confidence": caption.confidence} 
                        for caption in analysis.description.captions],
            "tags": analysis.description.tags
        }
    }
    
    return result