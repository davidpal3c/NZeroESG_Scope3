import pytest
from agent.tools import emissions_tool, supplier_tool, compare_tool
from agent.utils import safe_tool
import json

# Wrap tools with safe_tool for structured error handling during testing
safe_emissions_tool = safe_tool(emissions_tool.func)
safe_supplier_tool = safe_tool(supplier_tool.func)
safe_compare_tool = safe_tool(compare_tool.func)


def test_emissions_tool_valid_input():
    raw_input = json.dumps({
        "weight": 100,
        "distance": 1900,
        "transport_mode": "air"
    })
    response = safe_emissions_tool(raw_input)
    assert "co2e" in response or "OK" in response


def test_emissions_tool_missing_field():
    raw_input = json.dumps({
        "weight": 100,
        "transport_mode": "air"
    })  # missing distance
    result = safe_emissions_tool(raw_input)
    assert "ERROR" in result or "error" in result.lower()


def test_emissions_tool_units_parsing():
    raw_input = "weight: 1.2 tons, distance: 800 miles, transport_mode: rail"
    result = safe_emissions_tool(raw_input)
    assert "'weight':" in result and "'distance':" in result


def test_supplier_tool_valid_region():
    raw_input = json.dumps({"region": "EU"})
    response = safe_supplier_tool(raw_input)
    suppliers = json.loads(response)
    assert isinstance(suppliers, list)
    assert all("region" in s and s["region"] == "EU" for s in suppliers)


def test_supplier_tool_invalid_json():
    raw_input = "region: Europe"  # malformed
    response = safe_supplier_tool(raw_input)
    assert "ERROR" in response or "error" in response.lower()


def test_compare_tool_valid_input():
    raw_input = json.dumps({
        "weight": 500,
        "distance": 1000,
        "transport_mode": "multi"
    })
    response = safe_compare_tool(raw_input)
    parsed = json.loads(response)
    assert all(mode in parsed for mode in ["air", "rail", "sea"])


def test_compare_tool_empty_input():
    raw_input = json.dumps({})
    response = safe_compare_tool(raw_input)
    assert "air" in response or "error" in response.lower()
