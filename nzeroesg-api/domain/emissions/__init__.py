"""Deterministic freight-emissions calculation primitives."""

from domain.emissions.calculator import (
    CalculationResult,
    ComparisonResult,
    calculate_emissions,
    compare_emissions,
)
from domain.emissions.distance import Distance, DistanceMethod
from domain.emissions.factors import EmissionFactor, factor_for
from domain.emissions.modes import FreightMode, normalize_mode
from domain.emissions.units import (
    DistanceUnit,
    WeightUnit,
    normalize_distance_km,
    normalize_weight_kg,
)

__all__ = [
    "CalculationResult",
    "ComparisonResult",
    "Distance",
    "DistanceMethod",
    "DistanceUnit",
    "EmissionFactor",
    "FreightMode",
    "WeightUnit",
    "calculate_emissions",
    "compare_emissions",
    "factor_for",
    "normalize_distance_km",
    "normalize_mode",
    "normalize_weight_kg",
]
