from langchain.tools import Tool
import requests
import json
from config import CLIMATIQ_API_KEY
from agent.utils.parser_service import parse_agent_input

## TODO: add structured, agent-friendly error handling wrapper (safe_tool)


TRANSPORT_ACTIVITY_IDS = {
    "air": "freight_flight_route_type_international_aircraft_type_widebody",
    "sea": "freight_ship_ocean",
    "rail": "freight_train",
    "road": "freight_truck"
}

def calculate_emissions(input):
    # This function should call the Climatiq API to calculate emissions based on the input data.
    try: 
        mode = input.get("transport_mode", "").lower()
        activity_id = TRANSPORT_ACTIVITY_IDS.get(mode, None)

        if not activity_id:
            return {
                "error": f"Invalid transport mode: {mode}",
                "message": f"Transport mode '{mode}' is not supported. Supported modes: {', '.join(TRANSPORT_ACTIVITY_IDS.keys())}."
            }

        print(f"[TOOL] Calculating emissions for mode: {mode}, activity_id: {activity_id}")

        headers = {"Authorization": f"Bearer {CLIMATIQ_API_KEY}"}
        response = requests.post(
            "https://api.climatiq.io/data/v1/estimate",
            headers = headers,
            # json = input,
            json={
                "emission_factor": {
                    "activity_id": activity_id,
                    "data_version": "^21"
                },
                "parameters": {
                    "weight": float(input["weight"]),
                    "distance": float(input["distance"]),
                    "weight_unit": "kg",
                    "distance_unit": "km"
                }
            }
        )
    
        print(f"[TOOL] API status: {response.status_code}")
        print(f"[TOOL] API response: {response.text}")

        return response.json()
    
    except Exception as e:
        print(f"[TOOL] Error calling Climatiq API: {str(e)}")
        return {
            "error": str(e),
            "message": "Failed to calculate emissions. Please check data."
        }

    # return {
    #     "co2e": 100.0,
    #     "distance": "1902.0 km",
    #     "transport_mode": "air",
    #     "input": input,
    #     "source": "Climatiq"
    # }    

    # return {
    #     "co2e": 100.0,
    #     "distance": input["distance"],
    #     "transport_mode": input["transport_mode"],
    #     "weight": input["weight"],
    #     # "weight_unit": input.get("weight_unit", "kg"),
    #     "input": input,
    #     "source": "Climatiq"
    # }    



emissions_tool = Tool(
    name = "EmissionsCalculator",
    func = lambda input: calculate_emissions(parse_agent_input(input)),
    # func = lambda input: calculate_emissions(json.loads(input)),
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