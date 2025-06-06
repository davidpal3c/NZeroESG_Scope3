import json
import re

def parse_agent_input(text):
    # ## Parse the input text to extract relevant information for the agent.
    # # This function uses regex to find key-value pairs in the input text.
    # print(f"[PARSER] Parsing input: {text}")
    # try:
    #     return json.loads(text)  # Try strict JSON first
    # except:
    #     # Fallback: parse natural string like "distance: 2000km, weight: 100kg"
    #     match = re.findall(r'(\w+):\s*([\w\d.]+)', text)
    #     return {k: v for k, v in match}
    
    """
    Safely parse LangChain agent tool input.

    Supports:
    - JSON strings
    - Natural key:value strings (e.g., "weight: 2 tons, distance: 1240 miles")

    Normalizes common units to metric:
    - tons → kg
    - grams → kg
    - miles → km

    Returns:
        dict[str, str]
    """
    # try:
    #     return json.loads(text)
    # except json.JSONDecodeError:
    #     # Fallback to "key: value" parser
    #     result = {}
    #     matches = re.findall(r'(\w+)\s*:\s*([\w\d\.\-]+)', text)
    #     for k, v in matches:
    #         # Try to extract number from values like '2000km' or '100kg'
    #         if v.endswith(("kg", "KM", "km")):
    #             num = re.findall(r'[\d.]+', v)
    #             result[k] = float(num[0]) if num else v
    #         else:
    #             result[k] = v
    #     return result

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass  # try fallback below

    result = {}
    matches = re.findall(r'(\w+)\s*:\s*([^\s,]+)', text)
    for key, value in matches:
        key = key.lower()
        original = value

        # Extract numeric part
        num_match = re.match(r'([\d.]+)', value)
        num = float(num_match.group()) if num_match else None
        unit = value.replace(str(num), '').lower() if num else value.lower()

        # Normalize known units
        if key in ["weight", "mass"]:
            if "ton" in unit:
                result[key] = num * 1000  # tons to kg
            elif "g" in unit or "gr" or "grams" in unit and not "kg" in unit:
                result[key] = num / 1000  # grams to kg
            else:
                result[key] = num
        elif key in ["distance"]:
            if "mile" in unit:
                result[key] = num * 1.60934  # miles to km
            elif "m" in unit and not "km" in unit:
                result[key] = num / 1000  # meters to km
            else:
                result[key] = num
        else:
            result[key] = original if num is None else num

    if not result:
        raise ValueError("Unable to parse tool input: " + text)

    return result



    # """
    # Parse the input text to extract relevant information for the agent.
    # This function uses regex to find key-value pairs in the input text.
    # """
    # pattern = r"(\w+):\s*([^,]+)"
    # matches = re.findall(pattern, text)
    
    # parsed_data = {}
    # for key, value in matches:
    #     parsed_data[key.strip()] = value.strip()
    
    # return parsed_data