import requests
import json

BASE_URL = "http://127.0.0.1:8000/chat/"

test_message = {
    "message": "What is the CO2 impact of shipping 200kg by air from Berlin to Madrid?"
}

test_cases = [
    "What is the CO2 of shipping 200kg from Berlin to Madrid by air?",
    "Which supplier can deliver in Spain?",
    "Compare air vs rail shipment for 500km.",
    "What’s the carbon footprint of a 10kg sea shipment?"
]

def main():
    print(f"Sending message: {test_message['message']}")
    response = requests.post(BASE_URL, json=test_message)

    # for msg in test_cases:
    #     print(f"\nSending test message: {msg}")
    #     response = requests.post(BASE_URL, json={"message": msg})
    #     print(f"Response: {response.status_code} - {response.text}")

    try:
        response.raise_for_status()
        data = response.json()
        print("\nSuccess! Agent replied:")
        print(json.dumps(data, indent=2))
    except requests.exceptions.HTTPError as e:
        print("\nHTTP Error:")
        print(response.status_code, response.text)
    except Exception as e:
        print("\nUnexpected error:")
        print(str(e))

if __name__ == "__main__":
    main()
