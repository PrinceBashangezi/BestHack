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
        # Get visual features
        analysis = client.analyze_image_in_stream(
            image=image_stream,
            visual_features=["Tags", "Objects", "Description"]
        )
        
    # Also perform OCR to extract actual text
    with open(image_path, "rb") as image_stream:
        # Read text using OCR
        ocr_result = client.read_in_stream(image_stream, raw=True)
        
    # The OCR operation is async, get the operation ID
    operation_location = ocr_result.headers["Operation-Location"]
    operation_id = operation_location.split("/")[-1]
        
    # Wait for OCR to complete and get results
    import time
    max_retries = 10
    retry_delay = 1  # seconds
    
    for i in range(max_retries):
        read_result = client.get_read_result(operation_id)
        if read_result.status not in ['notStarted', 'running']:
            break
        time.sleep(retry_delay)
    
    # Extract text from OCR results
    extracted_text = ""
    if read_result.status == "succeeded":
        for text_result in read_result.analyze_result.read_results:
            for line in text_result.lines:
                extracted_text += line.text + " "
    
    # Convert to dictionary format for JSON response
    result = {
        "tags": [{"name": tag.name, "confidence": tag.confidence} for tag in analysis.tags],
        "objects": [{"object": obj.object_property, "confidence": obj.confidence} for obj in analysis.objects],
        "description": {
            "captions": [{"text": caption.text, "confidence": caption.confidence} 
                        for caption in analysis.description.captions],
            "tags": analysis.description.tags
        },
        "read_text": extracted_text.strip()  # Add the extracted OCR text
    }
    
    return result