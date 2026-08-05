"""Pure, deterministic freight-emissions calculations."""

from collections.abc import Sequence
from dataclasses import dataclass

from domain.emissions.distance import (
    Distance,
    DistanceMethod,
    route_distance,
    straight_line_distance,
)
from domain.emissions.factors import EmissionFactor, factor_for
from domain.emissions.modes import FreightMode, normalize_mode
from domain.emissions.units import DistanceUnit, WeightUnit, normalize_weight_kg


@dataclass(frozen=True)
class CalculationResult:
    """Stable calculation output with formula and provenance."""

    mode: FreightMode
    emissions_kg: float
    weight_kg: float
    distance: Distance
    factor: EmissionFactor
    warnings: tuple[str, ...]
    data_quality: str = "estimated"

    @property
    def emissions_tonnes(self) -> float:
        return round(self.emissions_kg / 1_000, 6)

    def to_dict(self) -> dict[str, object]:
        factor_data = self.factor.to_dict()
        distance_data = self.distance.to_dict()
        return {
            "method": self.mode.value,
            "emissions_kg": self.emissions_kg,
            "emissions_tonnes": self.emissions_tonnes,
            "weight_kg": self.weight_kg,
            "distance_km": self.distance.km,
            "distance_method": self.distance.method.value,
            "factor_kg_co2e_per_tonne_km": self.factor.value,
            "source": self.factor.source,
            "source_version": self.factor.version,
            "source_geography": self.factor.geography,
            "source_year": self.factor.year,
            "factor_unit": self.factor.unit,
            "applicability": self.factor.applicability,
            "assumptions": list(self.factor.assumptions),
            "formula": "(weight_kg / 1,000) * distance_km * factor_kg_co2e_per_tonne_km",
            "data_quality": self.data_quality,
            "warnings": list(self.warnings),
            "provenance": {
                "factor": factor_data,
                "distance": distance_data,
            },
        }


@dataclass(frozen=True)
class ComparisonResult:
    """Ordered comparison output derived from calculation results."""

    results: tuple[CalculationResult, ...]

    @property
    def lowest(self) -> CalculationResult:
        return min(self.results, key=lambda result: result.emissions_kg)

    def to_dict(self) -> dict[str, object]:
        lowest = self.lowest
        return {
            "summary": (
                f"{lowest.mode.value.capitalize()} has the lowest estimated "
                "footprint for this shipment."
            ),
            "lowest_emissions_method": lowest.mode.value,
            "details": {result.mode.value: result.to_dict() for result in self.results},
        }


def _normalize_distance_method(
    method: str | DistanceMethod,
) -> DistanceMethod:
    if isinstance(method, DistanceMethod):
        return method
    try:
        return DistanceMethod(method.strip().lower())
    except (AttributeError, ValueError) as exc:
        raise ValueError(f"Unsupported distance method: {method}") from exc


def calculate_emissions(
    *,
    weight_value: float,
    weight_unit: str | WeightUnit = WeightUnit.KILOGRAM,
    distance_value: float,
    distance_unit: str | DistanceUnit = DistanceUnit.KILOMETER,
    mode: str | FreightMode,
    distance_method: str | DistanceMethod = DistanceMethod.ROUTE,
    origin: str | None = None,
    destination: str | None = None,
) -> CalculationResult:
    """Calculate emissions without providers, persistence, or network calls."""
    normalized_mode = normalize_mode(mode)
    normalized_weight = normalize_weight_kg(weight_value, weight_unit)
    normalized_distance_method = _normalize_distance_method(distance_method)
    if normalized_distance_method is DistanceMethod.STRAIGHT_LINE:
        distance = straight_line_distance(
            distance_value,
            distance_unit,
            origin=origin,
            destination=destination,
        )
    elif normalized_distance_method is DistanceMethod.ROUTE:
        distance = route_distance(
            distance_value,
            distance_unit,
            origin=origin,
            destination=destination,
        )
    else:
        raise ValueError(f"Unsupported distance method: {distance_method}")

    factor = factor_for(normalized_mode)
    emissions_kg = (normalized_weight / 1_000) * distance.km * factor.value
    return CalculationResult(
        mode=normalized_mode,
        emissions_kg=round(emissions_kg, 6),
        weight_kg=normalized_weight,
        distance=distance,
        factor=factor,
        warnings=distance.warnings,
    )


def compare_emissions(
    *,
    weight_value: float,
    modes: Sequence[str | FreightMode],
    distance_value: float,
    weight_unit: str | WeightUnit = WeightUnit.KILOGRAM,
    distance_unit: str | DistanceUnit = DistanceUnit.KILOMETER,
    distance_method: str | DistanceMethod = DistanceMethod.ROUTE,
    origin: str | None = None,
    destination: str | None = None,
) -> ComparisonResult:
    """Calculate each mode in input order and expose deterministic ranking."""
    if len(modes) < 2:
        raise ValueError("Provide at least two transport modes to compare")

    results = tuple(
        calculate_emissions(
            weight_value=weight_value,
            weight_unit=weight_unit,
            distance_value=distance_value,
            distance_unit=distance_unit,
            mode=mode,
            distance_method=distance_method,
            origin=origin,
            destination=destination,
        )
        for mode in modes
    )
    return ComparisonResult(results=results)
