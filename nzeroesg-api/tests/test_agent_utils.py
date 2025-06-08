import pytest
from agent.utils import parse_agent_input, safe_tool

# mock tools
def mock_tool_success(parsed_input):
    return f"OK: {parsed_input}"

def mock_tool_fail(parsed_input):
    raise ValueError("simulated failure")

safe_success = safe_tool(mock_tool_success)
safe_fail = safe_tool(mock_tool_fail)


# unit tests for agent utils

def test_valid_json_input():
    raw = '{"weight": 100, "distance": 300, "transport_mode": "air"}'
    result = safe_success(raw)
    assert "OK" in result and "weight" in result

def test_key_value_string_with_units():
    raw = "weight: 2 tons, distance: 1240 miles"
    result = safe_success(raw)
    assert "OK" in result
    assert "'weight': 2000.0" in result
    assert "'distance': 1995.5816" in result

def test_grams_and_meters_normalization():
    raw = "weight: 500g, distance: 1200m"
    result = safe_success(raw)
    assert "'weight': 0.5" in result
    assert "'distance': 1.2" in result

def test_invalid_string_returns_error():
    raw = "just random text"
    result = safe_success(raw)
    assert result.startswith("ERROR")

def test_tool_exception_returns_error():
    raw = '{"weight": 100}'
    result = safe_fail(raw)
    assert result.startswith("ERROR: simulated failure")
