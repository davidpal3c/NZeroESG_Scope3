import json
import requests
from langchain.tools import StructuredTool
from langchain.tools import Tool
from rag.supplier_chain import query_suppliers_rag
from pydantic import BaseModel, Field
from config import CLIMATIQ_API_KEY, CARBON_INTERFACE_API_KEY
from agent.cache import make_cache_key, _emissions_cache, debug_registry
from agent.utils.parser_service import parse_agent_input
from geopy.distance import geodesic
from geopy.geocoders import Nominatim

## TODO: add structured, agent-friendly error handling wrapper (safe_tool)
## TODO: change in-memory caching to Redis

# Emission factos (g CO2e / tonne-km) for fallback calculations
FALLBACK_EMISSION_FACTORS = {
    "plane": 0.602,
    "air": 0.602,                              # kg CO2e / tonne-km
    "truck": 0.062,  
    "train": 0.022,  
    "ship": 0.008 ,                             # ocean_container 
    "ocean container": 0.008,                
    # "diesel_truck": 0.062,  
    # "diesel_train": 0.022, 
}

# Distance resolver tool
class DistanceInput(BaseModel):
    origin: str = Field(..., description="Origin city or location")
    destination: str = Field(..., description="Destination city or location")

def resolve_distance(origin: str, destination: str):
    try:

        # TODO: add transport-mode-aware API calls (branch out), use geopy (generic geodesic calculations) as fallback
        # OpenRouteService API (ORS):                                   truck / road 
        # OpenAIP / AviationStack :                                     air / plane
        # TransportAPI (UK), DB API (Germany), Navitia (France/ EU):    train / rail
        # SeaRoutes.com / MarineTraffic/ ExactEarth:                    ship / ocean
        

        print(f"[TOOL] Resolving distance from {origin} to {destination}")
        geolocator = Nominatim(user_agent="emission-agent")
        loc1 = geolocator.geocode(origin)
        loc2 = geolocator.geocode(destination)

        if loc1 and loc2:
            distance_km = round(geodesic((loc1.latitude, loc1.longitude), (loc2.latitude, loc2.longitude)).km, 1)
            
            print(f"\n[TOOL] Distance resolved: {distance_km} km\n")
            return {"origin": origin, "destination": destination, "distance_km": distance_km}
        else:
            return {"error": "Could not resolve one or both locations."}
    except Exception as e:
        return {"error": str(e)}



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
        weight_value = round(weight_value, 1)
        distance_value = round(distance_value, 1)
        key = make_cache_key(weight_value, distance_value, transport_method)

        if key in _emissions_cache:
            print(f"[CACHE] Using cached result for method: {transport_method}")
            cached = _emissions_cache[key]
            return {
                **cached,
                "note": f"As mentioned earlier: {debug_registry.get(key)}."
            }

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


        # TODo: finish Safe_tool: handle 400 errors gracefully to avoid agent crashes
        
        if response.status_code == 201:
            data = response.json().get("data", {}).get("attributes", {})
            return {
                "method": data.get("transport_method"),
                "carbon_g": data.get("carbon_g"),
                "carbon_lb": data.get("carbon_lb"),
                "carbon_kg": data.get("carbon_kg"),
                "carbon_mt": data.get("carbon_mt"),
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
    weight_unit: str = Field(default="kg", description="Weight unit (g, kg, lb, mt)")
    distance_unit: str = Field(default="km", description="Distance unit (km or mi)")
    transport_method: list[str] = Field(..., description="Transport modes to compare, e.g. ['ship', 'train', 'truck', 'plane']")
    distance_value: float | None = Field(..., description="Distance value (e.g., 2000)")
    origin: str | None = Field(default=None, description="Origin city or location (optional)")
    destination: str | None = Field(default=None, description="Destination city or location (optional)")


def compare_emissions(
        weight_value: float, 
        transport_method: list[str], 
        weight_unit: str = "kg", 
        distance_unit: str = "km",
        distance_value: float | None = None,
        origin: str | None = None,
        destination: str | None = None
    ):  

    try:
        if distance_value is None and origin and destination:
            resolved = resolve_distance(origin, destination)
            if "distance_km" in resolved:
                distance_value = resolved["distance_km"]
                print(f"[TOOL] Resolved distance() inside tool: {distance_value} km")
            else:
                return {"error": "Could not resolve distance between origin and destination."}

        if distance_value is None:
            return {"error": "Missing distance or locations to resolve distance."}

        results = {}
        api_calls = 0

        weight_value = round(weight_value, 1)
        distance_value = round(distance_value, 1)

        for method in transport_method: 
            key = make_cache_key(weight_value, distance_value, method)
            print(">>>>> EMISSIONS CACHE: ", _emissions_cache)

            if key in _emissions_cache:
                print(f"[CACHE] Using cached result for method: {method}")
                cached = _emissions_cache[key]
                results[method] = {
                    **cached,
                    "note": f"As mentioned earlier: {debug_registry.get(key)}."
                }
                continue           

            if api_calls < 3:
                print(f"[TOOL] Calculating emissions for method--: {method}")
                response = calculate_shipping_emissions(
                            weight_value=weight_value,
                            distance_value=distance_value,
                            transport_method=method,
                            weight_unit=weight_unit,
                            distance_unit=distance_unit
                        )
                
                if "carbon_kg" in response:
                    entry = {
                        "emissions_kg": response["carbon_kg"],
                        "emissions_tonnes": response.get("carbon_mt") or round(response["carbon_kg"] / 1000, 3),
                        "source": "Carbon Interface API"
                    }
                    _emissions_cache[key] = response
                    results[method] = entry
                    debug_registry[key] = f"API: {weight_value}kg over {distance_value}km by {method}"
                    api_calls += 1
                    continue        
            
            print(f"[TOOL] API call limit reached, using fallback for method: {method}")
            fallback_result = fallback_emission_estimate(
                weight=weight_value, 
                distance=distance_value, 
                method=method,
                weight_unit=weight_unit,
                distance_unit=distance_unit
            )

            _emissions_cache[key] = fallback_result
            results[method] = fallback_result
            debug_registry[key] = fallback_result["note"]
                
        # summary string for LLM
        summary_lines = []
        for method in transport_method:
            data = results[method]
            line = f"- {method}: {data['emissions_kg']} kg CO₂e ({data['emissions_tonnes']} tonnes)"
            if "note" in data:
                line += f" | {data['note']}"
            summary_lines.append(line)

        summary = summarize_emissions(
            results, 
            weight_value, 
            weight_unit, 
            distance_value, 
            distance_unit,
            origin=None, 
            destination=None  
        )

        return {
            "summary": summary,
            "details": results
        }

    except Exception as e:
        return {"error": str(e)}


# === fallback and summary functions ===

def fallback_emission_estimate(weight: float, distance: float, method: str, weight_unit: str = "kg", distance_unit: str = "km"):
    factor = FALLBACK_EMISSION_FACTORS.get(method.lower())

    if not factor:
        return { "error": f"Unsupported transport method: {method}" }

    # normalize to kg and km
    if weight_unit == "g":
        weight /= 1000  
    elif weight_unit == "lb":
        weight *= 0.453592  
    elif weight_unit == "mt":
        weight *= 1000
    else:
        weight = weight

    if distance_unit == "mi":
        distance *= 1.60934
    elif distance_unit == "m":
        distance /= 1000
    else:
        distance = distance

    emissions = (weight / 1000) * (distance * factor)  # Convert weight to tonnes

    return {
        "method": method,
        "emissions_kg": round(emissions, 2),
        "emissions_tonnes": round(emissions / 1000, 3),
        "source": "Fallback estimate",
        "note": f"Fallback: {weight}{weight_unit} over {distance}{distance_unit} by {method} using ECTA, CN Rail, and IPCC factors."
    }

def summarize_emissions(results, weight_value, weight_unit, distance_value, distance_unit, origin=None, destination=None):
    location_part = f" from {origin} to {destination}" if origin and destination else ""
    shipment_desc = f"{weight_value}{weight_unit} shipment{location_part} over {distance_value}{distance_unit}"

    parts = []
    for method, data in results.items():
        kg = round(data['emissions_kg'], 2)
        t = round(data['emissions_tonnes'], 2)
        parts.append(f"{method.capitalize()}: {kg} kg CO₂e ({t} t)")

    sorted_methods = sorted(results.items(), key=lambda x: x[1]['emissions_kg'])
    lowest = sorted_methods[0][0]

    return f"For a {shipment_desc}, emissions are: " + "; ".join(parts) + f". {lowest.capitalize()} has the lowest footprint."



# ===== Supplier Selector Tool =====
# class SupplierInput(BaseModel):
#     region: str = Field(..., description="Region to filter suppliers by")


# def select_supplier(input: SupplierInput):
#     try:
#         # extend to vectorDB search for suppliers (private knowledge base)
#         with open("nzeroesg-api/data/suppliers.json", "r") as file:
#             suppliers = json.load(file)

#         return [s for s in suppliers if s["region"].lower() == input.region.lower()]
#         # return json.dumps([ s for s in suppliers if s["region"] == criteria["region"] ])
#     except Exception as e:
#         return {"error": str(e), "message": "Could not load suppliers."}


# semantic_supplier_tool = Tool(
#     name="SupplierSelectorRAG",
#     func=lambda q: json.dumps(query_suppliers_rag(q, top_k=3)),
#     description="Query suppliers based on region, transport mode, description, certifications, " \
#     "carbon emissions per kg, esg rating, or other criteria using RAG (Retrieval-Augmented-Generation) " \
#     "search. Input should be a natural language query about suppliers (e.g., 'Find suppliers in Europe')."
# )

def structured_supplier_query(query: str) -> str:

    region = "Canada" if "canada" in query.lower() else None
    results = query_suppliers_rag(query, top_k=3, region=region)

    matches = results["matches"]

    if not matches:
        return json.dumps({"summary": "No suppliers found matching your query."}, indent=2)

    best = min(matches, key=lambda m: m["metadata"].get("carbon_emissions_per_shipment_kg", float("inf")))
    # best = min(results, key=lambda r: r["metadata"]["carbon_emissions_per_shipment_kg"])
    summary = (f"{best['metadata']['name']} emits only "
               f"{best['metadata']['carbon_emissions_per_shipment_kg']} kg "
               f"CO₂e per shipment — the lowest among the results.")

    return json.dumps({"summary": summary, "matches": matches}, indent=2)
    # return json.dumps(results, indent=2)


semantic_supplier_tool = Tool(
    name="SmartSupplierSearch - RAG",
    func=structured_supplier_query,
    # func=lambda q: json.dumps(query_suppliers_rag(q, top_k=3), indent=2),
    description="Query suppliers based on region, transport mode, description, certifications, " \
    "carbon emissions per kg, esg rating, or other criteria using RAG (Retrieval-Augmented-Generation) " \
    "search. Input should be a natural language query about suppliers (e.g., 'Find suppliers in Europe')."
)


# langchain tools
distance_tool = StructuredTool.from_function(
    name="DistanceResolver",
    func=resolve_distance,
    args_schema=DistanceInput,
    description="Resolve the geographic distance (in km) between two cities. Input must be origin and destination city names."
)

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

# supplier_tool = StructuredTool.from_function(
#     name="SupplierSelector",
#     description="Select suppliers based on region. Input should include the region name.",
#     func=select_supplier,
#     args_schema=SupplierInput
# )

