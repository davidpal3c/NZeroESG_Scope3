"""Unit types and deterministic normalization helpers."""

import math
from enum import Enum


class WeightUnit(str, Enum):
    GRAM = "g"
    KILOGRAM = "kg"
    POUND = "lb"
    METRIC_TONNE = "mt"


class DistanceUnit(str, Enum):
    METER = "m"
    KILOMETER = "km"
    MILE = "mi"


def _positive_finite(value: float, label: str) -> float:
    try:
        normalized = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{label} must be a finite positive number") from exc

    if not math.isfinite(normalized) or normalized <= 0:
        raise ValueError(f"{label} must be a finite positive number")
    return normalized


def _weight_unit(unit: str | WeightUnit) -> WeightUnit:
    if isinstance(unit, WeightUnit):
        return unit
    try:
        return WeightUnit(unit.strip().lower())
    except (AttributeError, ValueError) as exc:
        raise ValueError(f"Unsupported weight unit: {unit}") from exc


def _distance_unit(unit: str | DistanceUnit) -> DistanceUnit:
    if isinstance(unit, DistanceUnit):
        return unit
    try:
        return DistanceUnit(unit.strip().lower())
    except (AttributeError, ValueError) as exc:
        raise ValueError(f"Unsupported distance unit: {unit}") from exc


def normalize_weight_kg(value: float, unit: str | WeightUnit) -> float:
    """Normalize a positive weight to kilograms."""
    conversions = {
        WeightUnit.GRAM: 0.001,
        WeightUnit.KILOGRAM: 1.0,
        WeightUnit.POUND: 0.453592,
        WeightUnit.METRIC_TONNE: 1_000.0,
    }
    normalized = _positive_finite(value, "Weight")
    return round(normalized * conversions[_weight_unit(unit)], 6)


def normalize_distance_km(value: float, unit: str | DistanceUnit) -> float:
    """Normalize a positive distance to kilometres."""
    conversions = {
        DistanceUnit.METER: 0.001,
        DistanceUnit.KILOMETER: 1.0,
        DistanceUnit.MILE: 1.60934,
    }
    normalized = _positive_finite(value, "Distance")
    return round(normalized * conversions[_distance_unit(unit)], 6)
