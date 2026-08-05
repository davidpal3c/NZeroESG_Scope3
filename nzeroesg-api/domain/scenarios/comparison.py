"""Scenario comparisons over normalized shipments."""

from __future__ import annotations

from dataclasses import dataclass

from domain.emissions.calculator import calculate_emissions
from domain.emissions.modes import normalize_mode
from domain.shipments.models import NormalizedShipment


@dataclass(frozen=True)
class ScenarioShipment:
    shipment_id: str
    origin: str
    destination: str
    baseline_mode: str
    alternative_mode: str
    baseline_emissions_kg: float
    alternative_emissions_kg: float

    @property
    def delta_kg(self) -> float:
        return round(self.alternative_emissions_kg - self.baseline_emissions_kg, 6)

    def to_dict(self) -> dict[str, str | float]:
        return {
            "shipment_id": self.shipment_id,
            "origin": self.origin,
            "destination": self.destination,
            "baseline_mode": self.baseline_mode,
            "alternative_mode": self.alternative_mode,
            "baseline_emissions_kg": self.baseline_emissions_kg,
            "alternative_emissions_kg": self.alternative_emissions_kg,
            "delta_kg": self.delta_kg,
        }


@dataclass(frozen=True)
class ScenarioComparison:
    baseline_mode: str
    alternative_mode: str
    shipment_count: int
    baseline_total_kg: float
    alternative_total_kg: float
    shipment_results: tuple[ScenarioShipment, ...]
    factor_source: str
    factor_version: str
    assumptions: tuple[str, ...]

    @property
    def delta_kg(self) -> float:
        return round(self.alternative_total_kg - self.baseline_total_kg, 6)

    @property
    def delta_percent(self) -> float | None:
        if self.baseline_total_kg == 0:
            return None
        return round((self.delta_kg / self.baseline_total_kg) * 100, 4)

    def to_dict(self) -> dict[str, object]:
        return {
            "baseline_mode": self.baseline_mode,
            "alternative_mode": self.alternative_mode,
            "shipment_count": self.shipment_count,
            "baseline_total_kg": round(self.baseline_total_kg, 6),
            "alternative_total_kg": round(self.alternative_total_kg, 6),
            "baseline_total_tonnes": round(self.baseline_total_kg / 1_000, 6),
            "alternative_total_tonnes": round(self.alternative_total_kg / 1_000, 6),
            "delta_kg": self.delta_kg,
            "delta_percent": self.delta_percent,
            "shipment_results": [result.to_dict() for result in self.shipment_results],
            "factor_source": self.factor_source,
            "factor_version": self.factor_version,
            "assumptions": list(self.assumptions),
        }


def compare_shipment_modes(
    shipments: tuple[NormalizedShipment, ...] | list[NormalizedShipment],
    *,
    alternative_mode: str,
) -> ScenarioComparison:
    if not shipments:
        raise ValueError("Upload at least one valid shipment before running a scenario.")
    normalized_alternative = normalize_mode(alternative_mode).value
    results: list[ScenarioShipment] = []
    assumptions: list[str] = []
    sources: list[str] = []
    versions: list[str] = []
    baseline_total = 0.0
    alternative_total = 0.0
    baseline_modes = {shipment.transport_method for shipment in shipments}
    for shipment in shipments:
        baseline = calculate_emissions(
            weight_value=shipment.weight_kg,
            weight_unit="kg",
            distance_value=shipment.distance_km,
            distance_unit="km",
            mode=shipment.transport_method,
            distance_method="route",
            origin=shipment.origin,
            destination=shipment.destination,
        )
        alternative = calculate_emissions(
            weight_value=shipment.weight_kg,
            weight_unit="kg",
            distance_value=shipment.distance_km,
            distance_unit="km",
            mode=normalized_alternative,
            distance_method="route",
            origin=shipment.origin,
            destination=shipment.destination,
        )
        baseline_total += baseline.emissions_kg
        alternative_total += alternative.emissions_kg
        results.append(
            ScenarioShipment(
                shipment_id=shipment.shipment_id,
                origin=shipment.origin,
                destination=shipment.destination,
                baseline_mode=shipment.transport_method,
                alternative_mode=normalized_alternative,
                baseline_emissions_kg=baseline.emissions_kg,
                alternative_emissions_kg=alternative.emissions_kg,
            )
        )
        for factor in (baseline.factor, alternative.factor):
            sources.append(factor.source)
            versions.append(factor.version)
            assumptions.extend(factor.assumptions)
    return ScenarioComparison(
        baseline_mode=(next(iter(baseline_modes)) if len(baseline_modes) == 1 else "mixed"),
        alternative_mode=normalized_alternative,
        shipment_count=len(shipments),
        baseline_total_kg=round(baseline_total, 6),
        alternative_total_kg=round(alternative_total, 6),
        shipment_results=tuple(results),
        factor_source=next(iter(dict.fromkeys(sources))),
        factor_version=next(iter(dict.fromkeys(versions))),
        assumptions=tuple(dict.fromkeys(assumptions)),
    )
