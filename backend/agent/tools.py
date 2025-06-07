import requests
import json
from langchain.tools import Tool
from langchain.tools import StructuredTool
from pydantic import BaseModel, Field
from config import CLIMATIQ_API_KEY, CARBON_INTERFACE_API_KEY
from agent.utils.parser_service import parse_agent_input

## TODO: add structured, agent-friendly error handling wrapper (safe_tool)
## TODO: add distance resolver tool 
## TODO: add caching layer (avoid re-calling with same inputs), using ConversationBufferMemory and/or Redis 

# Emission factos (g CO2e / tonne-km) for fallback calculations
FALLBACK_EMISSION_FACTORS = {
    "plane": 0.602,                             # kg CO2e / tonne-km
    "truck": 0.062,  
    "train": 0.022,  
    "ship": 0.008 ,                             # ocean_container              
    # "diesel_truck": 0.062,  
    # "diesel_train": 0.022, 
}


# Shipping Emissions Calculation Tool 
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
            data = response.json().get("data", {}).get("attributes", {})
            return {
                "method": data.get("transport_method"),
                "carbon_g": data.get("carbon_g"),
                "carbon_lb": data.get("carbon_lb"),
                "carbon_kg": data.get("carbon_kg"),
                "distance": data.get("distance_value"),
                "weight": data.get("weight_value"),
                "distance_unit": data.get("distance_unit"),
                "weight_unit": data.get("weight_unit"),
                "source": "Carbon Interface API",
            }

        
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
    

# ===== Comparing Tool: transport mode CO2 emissions =====
class CompareInput(BaseModel):
    weight_value: float = Field(..., description="Weight value (e.g., 200)")
    distance_value: float = Field(..., description="Distance value (e.g., 2000)")
    weight_unit: str = Field(default="kg", description="Weight unit (g, kg, lb, mt)")
    distance_unit: str = Field(default="km", description="Distance unit (km or mi)")
    transport_method: list[str] = Field(..., description="Transport modes to compare, e.g. ['ship', 'train', 'truck', 'plane']")


def fallback_emission_estimate(weight_kg: float, distance_km: float, method: str):
    factor = FALLBACK_EMISSION_FACTORS.get(method.lower())

    if not factor:
        return { "error": f"Unsupported transport method: {method}" }

    emissions = (weight_kg / 1000) * (distance_km * factor)  # Convert weight to tonnes
    return {
        "method": method,
        "emissions_kg": round(emissions, 2),
        "emissions_tonnes": round(emissions / 1000, 3),
        "note": "Fallback estimate: This is an approximation using emission factors from ECTA, CN Rail, and IPCC."
    }

def compare_emissions(weight_value: float, distance_value: float, transport_method: list[str], weight_unit: str = "kg", distance_unit: str = "km"):  
    try:
        results = {}
        api_calls = 0

        for method in transport_method: 
            if api_calls < 3:
                print(f"[TOOL] Calculating emissions for method--: {method}")
                result = calculate_shipping_emissions(
                            weight_value=weight_value,
                            distance_value=distance_value,
                            transport_method=method,
                            weight_unit=weight_unit,
                            distance_unit=distance_unit
                        )
                
                if "carbon_kg" in result or "carbon_g" in result:
                    results[method] = {
                        "emissions_kg": result["carbon_kg"],
                        "emissions_tonnes": round(result["carbon_kg"] / 1000, 3),
                        "source": "Carbon Interface API"
                    }
                    api_calls += 1
                    continue        
            else:
                print(f"[TOOL] API call limit reached, using fallback for method: {method}")
                results[method] = fallback_emission_estimate(
                    weight_value, 
                    distance_value, 
                    method
                )
        # 
        if api_calls == 0 and bool(results) == False:
            for method in transport_method:
                results[method] = fallback_emission_estimate(
                    weight_value, 
                    distance_value, 
                    method
                )

        return results

    except Exception as e:
        return {"error": str(e)}



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


# langchain tools

emissions_tool = StructuredTool.from_function(
    name = "EmissionsCalculator",
    func = calculate_shipping_emissions,
    args_schema = ShippingEmissionsInput,
    description = "Calculate CO2 for shipments. Input should include distance, transport_mode, weight."
)

compare_shipping_emissions = StructuredTool.from_function(
    name="OptionComparer",
    description="Compare different transport options based on CO2 emissions. Input should include distance and weight.",
    func=compare_emissions,
    args_schema=CompareInput
)

supplier_tool = StructuredTool.from_function(
    name="SupplierSelector",
    description="Select suppliers based on region. Input should include the region name.",
    func=select_supplier,
    args_schema=SupplierInput
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


