# from config import HUGGINGFACEHUB_API_TOKEN
import os
import requests

headers = {
    "Authorization": f"Bearer ${os.getenv("HUGGINGFACEHUB_API_TOKEN")}"
}
data = {
    "inputs": "Test sentence embedding"
}
r = requests.post(
    # "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2",                            //model
    "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
    headers=headers, json=data
)
print(r.json())
if r.status_code == 200:
    print("HuggingFace API is working correctly.")
else:    
    print(f"Error: {r.status_code} - {r.text}")