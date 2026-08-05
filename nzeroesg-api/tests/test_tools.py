from dataclasses import replace

import pytest

import agent.tools as tools
from agent.tools import (
    calculate_shipping_emissions,
    compare_emissions,
    fallback_emission_estimate,
    normalize_distance_km,
    normalize_weight_kg,
)


@pytest.fixture(autouse=True)
def disable_optional_provider(monkeypatch):
    """Keep calculator unit tests deterministic and network-free."""
    monkeypatch.setattr(
        tools,
        "settings",
        replace(tools.settings, carbon_interface_api_key=None),
    )


@pytest.mark.parametrize(
    ("value", "unit", "expected"),
    [(1_000, "g", 1), (2, "kg", 2), (2, "lb", 0.907184), (1.5, "mt", 1_500)],
)
def test_weight_normalization(value, unit, expected):
    assert normalize_weight_kg(value, unit) == pytest.approx(expected)


@pytest.mark.parametrize(
    ("value", "unit", "expected"),
    [(1_000, "m", 1), (2, "km", 2), (10, "mi", 16.0934)],
)
def test_distance_normalization(value, unit, expected):
    assert normalize_distance_km(value, unit) == pytest.approx(expected)


def test_fallback_result_exposes_formula_inputs_and_provenance():
    result = fallback_emission_estimate(1, 100, "train", "mt", "km")

    assert result["emissions_kg"] == 2.2
    assert result["weight_kg"] == 1_000
    assert result["distance_km"] == 100
    assert result["factor_kg_co2e_per_tonne_km"] == 0.022
    assert result["data_quality"] == "estimated"
    assert result["source_version"] == "prototype-2026.1"
    assert "authoritative" in result["applicability"]


def test_calculator_works_without_a_paid_provider():
    result = calculate_shipping_emissions(500, 1_000, "ship")

    assert result["emissions_kg"] == 4
    assert result["source"] == "NZeroESG prototype factor schedule"
    assert result["source_version"] == "prototype-2026.1"


def test_comparison_orders_modes_by_calculated_emissions():
    result = compare_emissions(
        weight_value=1_000,
        distance_value=1_000,
        transport_method=["plane", "truck", "train", "ship"],
    )

    assert result["lowest_emissions_method"] == "ship"
    assert list(result["details"]) == ["plane", "truck", "train", "ship"]


def test_unsupported_units_fail_explicitly():
    with pytest.raises(ValueError, match="Unsupported weight unit"):
        normalize_weight_kg(10, "stone")
