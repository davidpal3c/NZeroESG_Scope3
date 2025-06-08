import json
import re


# uses regex to find key-value pairs in the input text to extract relevant information for the agent.
def parse_agent_input(text):
    """
    Parse user input to extract emissions-related parameters.

    Supports:
    - JSON strings (structured input)
    - Natural phrases like:
        * "from X to Y" → origin/destination
        * "<number>kg" → weight_value
        * "in plane and train" → transport_method (list)

    Returns:
        dict with keys like: weight_value, origin, destination, transport_method
    """

    text = text.lower()

    result = {}

    # --- Weight ---
    weight_match = re.search(r'(\d+(?:\.\d+)?)\s*(kg|kilograms|tons|tonnes|g|grams|gr)', text)
    if weight_match:
        weight, unit = weight_match.groups()
        weight = float(weight)
        if "ton" in unit:
            result["weight_value"] = weight * 1000
        elif unit.startswith("g") and not "kg" in unit:
            result["weight_value"] = weight / 1000
        else:
            result["weight_value"] = weight

    # --- Origin/Destination ---
    route_match = re.search(r'from\s+([a-z\s]+?)\s+to\s+([a-z\s]+?)(?:\s|,|\.|\?|$)', text)
    if route_match:
        result["origin"] = route_match.group(1).strip()
        result["destination"] = route_match.group(2).strip()

    # --- Transport Modes ---
    modes_match = re.search(r'in\s+((?:[a-z]+\s*(?:and\s*)?)+)', text)
    if modes_match:
        modes_raw = modes_match.group(1)
        synonym_map = {
            "air": "plane", "aerial": "plane", "plane": "plane",
            "rail": "train", "train": "train",
            "truck": "truck", "road": "truck", "lorry": "truck", "van": "truck",
            "ship": "ship", "ocean": "ship", "boat": "ship"
        }
        tokens = re.findall(r'\w+', modes_raw)
        modes = list({synonym_map[m] for m in tokens if m in synonym_map})
        if modes:
            result["transport_method"] = modes

    return result
