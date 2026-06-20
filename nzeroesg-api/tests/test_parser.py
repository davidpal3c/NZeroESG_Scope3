from agent.utils.exception_wrapper import safe_tool
from agent.utils.parser_service import parse_agent_input


def test_json_input_is_preserved():
    parsed = parse_agent_input('{"weight_value": 100, "transport_method": ["train"]}')

    assert parsed == {"weight_value": 100, "transport_method": ["train"]}


def test_natural_language_extracts_weight_route_and_modes():
    parsed = parse_agent_input("Compare 2 tonnes from Edmonton to Calgary by rail and truck.")

    assert parsed["weight_value"] == 2_000
    assert parsed["origin"] == "edmonton"
    assert parsed["destination"] == "calgary"
    assert parsed["transport_method"] == ["train", "truck"]


def test_safe_tool_rejects_unparseable_input():
    wrapped = safe_tool(lambda **values: values)

    assert wrapped("nothing useful here") == "ERROR: Could not parse tool input."
