"""Deterministic shipment totals, mode breakdowns, and hotspots."""

from __future__ import annotations

from dataclasses import dataclass

from domain.emissions.calculator import calculate_emissions
from domain.emissions.factors import factor_for
from domain.shipments.models import NormalizedShipment


@dataclass(frozen=True)
class ModeBreakdown:
    shipment_count: int
    weight_kg: float
    emissions_kg: float

    def to_dict(self) -> dict[str, int | float]:
        return {
            "shipment_count": self.shipment_count,
            "weight_kg": round(self.weight_kg, 6),
            "emissions_kg": round(self.emissions_kg, 6),
        }


@dataclass(frozen=True)
class ShipmentHotspot:
    shipment_id: str
    origin: str
    destination: str
    transport_method: str
    emissions_kg: float

    def to_dict(self) -> dict[str, str | float]:
        return {
            "shipment_id": self.shipment_id,
            "origin": self.origin,
            "destination": self.destination,
            "transport_method": self.transport_method,
            "emissions_kg": self.emissions_kg,
        }


@dataclass(frozen=True)
class ShipmentAnalysis:
    shipment_count: int
    total_weight_kg: float
    total_emissions_kg: float
    mode_breakdown: dict[str, ModeBreakdown]
    hotspots: tuple[ShipmentHotspot, ...]
    warnings: tuple[str, ...]
    factor_source: str
    factor_version: str
    factor_applicability: str
    assumptions: tuple[str, ...]

    def to_dict(self) -> dict[str, object]:
        return {
            "shipment_count": self.shipment_count,
            "total_weight_kg": round(self.total_weight_kg, 6),
            "total_emissions_kg": round(self.total_emissions_kg, 6),
            "total_emissions_tonnes": round(self.total_emissions_kg / 1_000, 6),
            "mode_breakdown": {
                mode: breakdown.to_dict() for mode, breakdown in self.mode_breakdown.items()
            },
            "hotspots": [hotspot.to_dict() for hotspot in self.hotspots],
            "warnings": list(self.warnings),
            "factor_source": self.factor_source,
            "factor_version": self.factor_version,
            "factor_applicability": self.factor_applicability,
            "assumptions": list(self.assumptions),
        }


def analyze_shipments(
    shipments: tuple[NormalizedShipment, ...] | list[NormalizedShipment],
    *,
    parser_warnings: tuple[str, ...] = (),
) -> ShipmentAnalysis:
    mode_totals: dict[str, list[float]] = {}
    hotspots: list[ShipmentHotspot] = []
    total_weight = 0.0
    total_emissions = 0.0
    factor_sources: list[str] = []
    factor_versions: list[str] = []
    assumptions: list[str] = []
    warnings = list(parser_warnings)

    for shipment in shipments:
        result = calculate_emissions(
            weight_value=shipment.weight_kg,
            weight_unit="kg",
            distance_value=shipment.distance_km,
            distance_unit="km",
            mode=shipment.transport_method,
            distance_method="route",
            origin=shipment.origin,
            destination=shipment.destination,
        )
        total_weight += shipment.weight_kg
        total_emissions += result.emissions_kg
        mode_values = mode_totals.setdefault(shipment.transport_method, [0.0, 0.0, 0.0])
        mode_values[0] += 1
        mode_values[1] += shipment.weight_kg
        mode_values[2] += result.emissions_kg
        hotspots.append(
            ShipmentHotspot(
                shipment_id=shipment.shipment_id,
                origin=shipment.origin,
                destination=shipment.destination,
                transport_method=shipment.transport_method,
                emissions_kg=result.emissions_kg,
            )
        )
        factor = factor_for(shipment.transport_method)
        factor_sources.append(factor.source)
        factor_versions.append(factor.version)
        assumptions.extend(factor.assumptions)
        warnings.extend(result.warnings)

    unique_sources = tuple(dict.fromkeys(factor_sources))
    unique_versions = tuple(dict.fromkeys(factor_versions))
    unique_assumptions = tuple(dict.fromkeys(assumptions))
    if len(unique_sources) > 1 or len(unique_versions) > 1:
        warnings.append("Multiple factor records are present in this analysis.")
    return ShipmentAnalysis(
        shipment_count=len(shipments),
        total_weight_kg=round(total_weight, 6),
        total_emissions_kg=round(total_emissions, 6),
        mode_breakdown={
            mode: ModeBreakdown(
                shipment_count=int(values[0]),
                weight_kg=values[1],
                emissions_kg=values[2],
            )
            for mode, values in mode_totals.items()
        },
        hotspots=tuple(
            sorted(
                hotspots,
                key=lambda hotspot: (-hotspot.emissions_kg, hotspot.shipment_id),
            )[:10]
        ),
        warnings=tuple(dict.fromkeys(warnings)),
        factor_source=(
            unique_sources[0] if len(unique_sources) == 1 else "Multiple factor records"
        ),
        factor_version=(
            unique_versions[0] if len(unique_versions) == 1 else "Multiple factor versions"
        ),
        factor_applicability=(
            factor_for(shipments[0].transport_method).applicability
            if shipments
            else "No factor was applied because no valid rows were accepted."
        ),
        assumptions=unique_assumptions,
    )
