import requests
import json
from langchain.tools import Tool
from langchain.tools import StructuredTool
from pydantic import BaseModel, Field
from config import CLIMATIQ_API_KEY, CARBON_INTERFACE_API_KEY
from agent.utils.parser_service import parse_agent_input

## TODO: add structured, agent-friendly error handling wrapper (safe_tool)
## TODO: add distance resolver tool 
## TODO: add caching layer (avoid re-calling with same inputs),

# ===== Shipping Emissions Calculation Tool (Carbon Interface) =====
class ShippingEmissionsInput(BaseModel):
    weight_value: float = Field(..., description="Weight value (e.g., 200)")
    weight_unit: str = Field(default="kg", description="Weight unit (g, kg, lb, mt)")
    distance_value: float = Field(..., description="Distance value (e.g., 2000)")
    distance_unit: str = Field(default="km", description="Distance unit (km or mi)")
    transport_method: str = Field(..., description="Transport method (ship, train, truck, plane)")


def calculate_shipping_emissions(
        weight_value: float, 
        distance_value: float, 
        transport_method: str,
        weight_unit: str = "kg",
        distance_unit: str = "km"
    ):
    
    try: 
        headers = {
            "Authorization": f"Bearer {CARBON_INTERFACE_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "type": "shipping",
            "weight_value": weight_value,
            "weight_unit": weight_unit,
            "distance_value": distance_value,
            "distance_unit": distance_unit,
            "transport_method": transport_method.lower()    
        }

        print(f"[TOOL] Sending payload to Carbon Interface:\n{json.dumps(payload, indent=3)}")

        response = requests.post(
            "https://www.carboninterface.com/api/v1/estimates",
            # "https://api.carboninterface.com/v1/estimates",
            headers=headers,
            json=payload
        )

        print(f"[TOOL] API status: {response.status_code}")
        print(f"[TOOL] API response: {response.text}")

## TODO: Safe_tool: handle 400 errors gracefully to avoid agent crashes

        if response.status_code == 201:
            return response.json()

            # data = response.json().get("data", {}).get("attributes", {})
            # return {
            #     "carbon_kg": data.get("carbon_kg"),
            #     "distance_km": data.get("distance_value"),
            #     "weight_kg": data.get("weight_value"),
            #     "transport_method": data.get("transport_method")
            # }

        
        # Otherwise return graceful error, no exceptions
        return {
            "error": f"API call returned unexpected status {response.status_code}",
            "message": response.text
        }
    except Exception as e:
        print(f"[TOOL] Error calling Carbon Interface API: {str(e)}")
        return {
            "error": str(e),
            "message": "Failed to calculate emissions. Please check data."
        }

emissions_tool = StructuredTool.from_function(
    name = "EmissionsCalculator",
    func = calculate_shipping_emissions,
    args_schema = ShippingEmissionsInput,
    description = "Calculate CO2 for shipments. Input should include distance, transport_mode, weight."
)


# ===== Supplier Selector Tool =====
class SupplierInput(BaseModel):
    region: str = Field(..., description="Region to filter suppliers by")


def select_supplier(input: SupplierInput):
    try:
        with open("backend/data/suppliers.json", "r") as file:
            suppliers = json.load(file)
        return [s for s in suppliers if s["region"].lower() == input.region.lower()]
        # return json.dumps([ s for s in suppliers if s["region"] == criteria["region"] ])
    except Exception as e:
        return {"error": str(e), "message": "Could not load suppliers."}

supplier_tool = StructuredTool.from_function(
    name="SupplierSelector",
    description="Select suppliers based on region. Input should include the region name.",
    func=select_supplier,
    args_schema=SupplierInput
)


# ===== Transport Option Comparison Tool =====
class CompareInput(BaseModel):
    distance: float = Field(..., description="Distance in kilometers")
    weight: float = Field(..., description="Weight in kilograms")


def compare_options(input: CompareInput):
    try:
        # Placeholder for real comparison logic
        return {
            "air": f"{input.weight * 1.2:.1f}kg CO2",
            "rail": f"{input.weight * 0.4:.1f}kg CO2",
            "sea": f"{input.weight * 0.2:.1f}kg CO2"
        }
    except Exception as e:
        return {"error": str(e)}


compare_tool = StructuredTool.from_function(
    name="OptionComparer",
    description="Compare different transport options based on CO2 emissions. Input should include distance and weight.",
    func=compare_options,
    args_schema=CompareInput
)


# def compare_options(input):
#     try:
#         # ToDO: implement comparison logic
#         # Return dummy comparison
#         return json.dumps({"air": "500kg CO2", "rail": "180kg CO2", "sea": "90kg CO2"})
#     except Exception as e:
#         return json.dumps({"error": str(e)})

# compare_tool = Tool(
#     name = "OptionComparer",
#     func = compare_options,
#     # func = lambda input: compare_options(json.loads(input)),
#     description = "Compare different transport options based on CO2 emissions."
# )

# supplier_tool = Tool(
#     name = "SupplierSelector",
#     func = lambda input: select_supplier(input),
#     description = "Select suppliers based on region or category."
# )





# TRANSPORT_ACTIVITY_IDS = {
#     "air": "freight_flight_route_type_international_aircraft_type_widebody",
#     "sea": "freight_ship_ocean",
#     "rail": "freight_train",
#     "road": "freight_truck"
# }

# # rename to calculate_shipping_emissions and accomodate more parameters:
# # rename: 
# # weight to weight_value
# # distance to distance_value
# # transport_mode to transport_method
# def calculate_emissions(distance: float, weight: float, transport_mode: str):
#     # This function should call the Climatiq API to calculate emissions based on the input data.
#     try: 
#         mode = transport_mode.lower()
#         activity_id = TRANSPORT_ACTIVITY_IDS.get(mode)

#         if not activity_id:
#             return {
#                 "error": f"Invalid transport mode: {mode}",
#                 "message": f"Supported modes: {', '.join(TRANSPORT_ACTIVITY_IDS)}"
#         }

#         print(f"[TOOL] Calculating emissions for mode: {mode}, activity_id: {activity_id}")

#         headers = {"Authorization": f"Bearer {CLIMATIQ_API_KEY}"}
#         response = requests.post(
#             "https://api.climatiq.io/data/v1/estimate",
#             headers = headers,
#             # json = input,
#             json={
#                 "emission_factor": {
#                     "activity_id": activity_id,
#                     "data_version": "^21"
#                 },
#                 "parameters": {
#                     "weight": weight,
#                     "distance": distance,
#                     "weight_unit": "kg",
#                     "distance_unit": "km"
#                 }
#             }
#         )
    
#         print(f"[TOOL] API status: {response.status_code}")
#         print(f"[TOOL] API response: {response.text}")

#         return response.json()
    
#     except Exception as e:
#         print(f"[TOOL] Error calling Climatiq API: {str(e)}")
#         return {
#             "error": str(e),
#             "message": "Failed to calculate emissions. Please check data."
#         }

#     # return {
#     #     "co2e": 100.0,
#     #     "distance": "1902.0 km",
#     #     "transport_mode": "air",
#     #     "input": input,
#     #     "source": "Climatiq"
#     # }    

#     # return {
#     #     "co2e": 100.0,
#     #     "distance": input["distance"],
#     #     "transport_mode": input["transport_mode"],
#     #     "weight": input["weight"],
#     #     # "weight_unit": input.get("weight_unit", "kg"),
#     #     "input": input,
#     #     "source": "Climatiq"
#     # }    


