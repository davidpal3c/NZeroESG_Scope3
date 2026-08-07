import pytest

from domain.emissions.calculator import calculate_emissions, compare_emissions
from domain.emissions.distance import DistanceMethod
from domain.emissions.factors import factor_for
from domain.emissions.modes import FreightMode, normalize_mode
from domain.emissions.units import normalize_distance_km, normalize_weight_kg


def test_unit_normalization_uses_canonical_base_units():
    assert normalize_weight_kg(1.5, "mt") == 1_500
    assert normalize_weight_kg(2, "lb") == pytest.approx(0.907184)
    assert normalize_distance_km(10, "mi") == pytest.approx(16.0934)


def test_invalid_units_and_values_fail_explicitly():
    with pytest.raises(ValueError, match="Unsupported weight unit"):
        normalize_weight_kg(10, "stone")
    with pytest.raises(ValueError, match="finite positive"):
        normalize_distance_km(0, "km")


def test_mode_aliases_resolve_to_canonical_modes():
    assert normalize_mode("air") is FreightMode.PLANE
    assert normalize_mode("ocean container") is FreightMode.SHIP


def test_factor_records_are_versioned_and_applicable():
    factor = factor_for("train")

    assert factor.value == 0.022
    assert factor.version == "prototype-2026.1"
    assert factor.geography == "global illustrative"
    assert factor.year == 2026
    assert factor.assumptions


def test_calculation_matches_golden_formula_and_exposes_provenance():
    result = calculate_emissions(
        weight_value=1,
        weight_unit="mt",
        distance_value=100,
        distance_unit="km",
        mode="train",
    )

    assert result.emissions_kg == 2.2
    assert result.to_dict()["formula"] == (
        "(weight_kg / 1,000) * distance_km * factor_kg_co2e_per_tonne_km"
    )
    assert result.to_dict()["source"] == "CarbonSage prototype factor schedule"
    assert result.to_dict()["assumptions"]
    assert result.to_dict()["warnings"] == []


def test_straight_line_fallback_is_separate_and_warned():
    result = calculate_emissions(
        weight_value=500,
        distance_value=1_000,
        mode="ship",
        distance_method=DistanceMethod.STRAIGHT_LINE,
        origin="Edmonton",
        destination="Calgary",
    )

    assert result.distance.method is DistanceMethod.STRAIGHT_LINE
    assert result.to_dict()["warnings"] == [
        "Straight-line fallback distance; mode-specific route distance was not provided."
    ]
    assert result.to_dict()["provenance"]["distance"]["origin"] == "Edmonton"


def test_repeated_calculations_are_identical_and_unit_identity_is_safe():
    metric = calculate_emissions(
        weight_value=1,
        weight_unit="mt",
        distance_value=1_000,
        mode="truck",
    )
    repeated = calculate_emissions(
        weight_value=1,
        weight_unit="mt",
        distance_value=1_000,
        mode="truck",
    )
    kilograms = calculate_emissions(
        weight_value=1,
        weight_unit="kg",
        distance_value=1_000,
        mode="truck",
    )

    assert metric == repeated
    assert metric.emissions_kg != kilograms.emissions_kg


def test_comparison_preserves_input_order_and_ranks_by_result():
    comparison = compare_emissions(
        weight_value=1_000,
        distance_value=1_000,
        modes=["plane", "truck", "train", "ship"],
    )

    assert [result.mode.value for result in comparison.results] == [
        "plane",
        "truck",
        "train",
        "ship",
    ]
    assert comparison.lowest.mode is FreightMode.SHIP
    assert comparison.to_dict()["lowest_emissions_method"] == "ship"
