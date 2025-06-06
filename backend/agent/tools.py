from langchain.tools import Tool
import requests
import json
from config import CLIMATIQ_API_KEY

def calculate_emissions(input):
    # This function should call the Climatiq API to calculate emissions based on the input data.
    headers = {"Authorization": f"Bearer {CLIMATIQ_API_KEY}"}
    response = requests.post(
        "https://api.climatiq.io/estimate",
        headers=headers,
        json=input
    )

    # For now, let's use a dummy response
    # Simulating a response from the Climatiq API
    response = {
        "co2e": 100.0,  # CO2 equivalent in kg
        "source": "ClimatiQ API",
        "input": input
    }

    # Return the response in the expected format
    # return {
    #     "co2e": response["co2e"],
    #     "source": response["source"],
    #     "input": response["input"]
    # }
    return response.json()


emissions_tool = Tool(
    name = "EmissionsCalculator",
    func = lambda input: json.dumps(calculate_emissions(json.loads(input))),
    description = "Calculate CO2 for shipments. Input should include distance, transport_mode, weight."
)


def select_supplier(criteria):
    ##Load from local JSON
    with open("backend/data/suppliers.json", "r") as file:
        suppliers = json.load(file)

    # i.e. filter suppliers based on criteria 
    return json.dumps([ s for s in suppliers if s["region"] == criteria["region"] ])


supplier_tool = Tool(
    name = "SupplierSelector",
    func = lambda input: select_supplier(input),
    description = "Select suppliers based on region or category."
)

def compare_options(input):
    try:
        # ToDO: implement comparison logic
        # Return dummy comparison
        return json.dumps({"air": "500kg CO2", "rail": "180kg CO2", "sea": "90kg CO2"})
    except Exception as e:
        return json.dumps({"error": str(e)})


compare_tool = Tool(
    name = "OptionComparer",
    func = compare_options,
    # func = lambda input: compare_options(json.loads(input)),
    description = "Compare different transport options based on CO2 emissions."
)