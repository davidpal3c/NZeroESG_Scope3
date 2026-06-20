import json
import re


def parse_agent_input(text: str) -> dict[str, object]:
    """Extract basic freight parameters from JSON or a natural-language query."""
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        parsed = None
    if isinstance(parsed, dict):
        return parsed

    normalized = text.lower()
    result: dict[str, object] = {}

    weight_match = re.search(
        r"(\d+(?:\.\d+)?)\s*(kg|kilograms|tons|tonnes|g|grams|gr)",
        normalized,
    )
    if weight_match:
        weight, unit = weight_match.groups()
        weight = float(weight)
        if "ton" in unit:
            result["weight_value"] = weight * 1000
        elif unit.startswith("g") and "kg" not in unit:
            result["weight_value"] = weight / 1000
        else:
            result["weight_value"] = weight

    route_match = re.search(
        r"from\s+([a-z\s]+?)\s+to\s+([a-z\s]+?)(?:\s+by|\s+in|,|\.|\?|$)",
        normalized,
    )
    if route_match:
        result["origin"] = route_match.group(1).strip()
        result["destination"] = route_match.group(2).strip()

    synonym_map = {
        "air": "plane",
        "aerial": "plane",
        "plane": "plane",
        "rail": "train",
        "train": "train",
        "truck": "truck",
        "road": "truck",
        "lorry": "truck",
        "van": "truck",
        "ship": "ship",
        "ocean": "ship",
        "boat": "ship",
    }
    modes = []
    for token in re.findall(r"\w+", normalized):
        mode = synonym_map.get(token)
        if mode and mode not in modes:
            modes.append(mode)
    if modes:
        result["transport_method"] = modes

    return result
