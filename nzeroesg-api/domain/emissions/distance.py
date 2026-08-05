"""Distance provenance without geocoding or network dependencies."""

from dataclasses import dataclass
from enum import Enum

from domain.emissions.units import DistanceUnit, normalize_distance_km


class DistanceMethod(str, Enum):
    ROUTE = "route"
    STRAIGHT_LINE = "straight_line"


@dataclass(frozen=True)
class Distance:
    """A normalized distance and the method used to obtain it."""

    km: float
    method: DistanceMethod
    origin: str | None = None
    destination: str | None = None
    warnings: tuple[str, ...] = ()

    def to_dict(self) -> dict[str, object]:
        return {
            "distance_km": self.km,
            "method": self.method.value,
            "origin": self.origin,
            "destination": self.destination,
            "warnings": list(self.warnings),
        }


def _distance(
    value: float,
    unit: str | DistanceUnit,
    method: DistanceMethod,
    *,
    origin: str | None,
    destination: str | None,
) -> Distance:
    return Distance(
        km=normalize_distance_km(value, unit),
        method=method,
        origin=origin,
        destination=destination,
        warnings=(
            "Straight-line fallback distance; mode-specific route distance was not provided.",
        )
        if method is DistanceMethod.STRAIGHT_LINE
        else (),
    )


def route_distance(
    value: float,
    unit: str | DistanceUnit = DistanceUnit.KILOMETER,
    *,
    origin: str | None = None,
    destination: str | None = None,
) -> Distance:
    """Create a distance explicitly supplied as a route distance."""
    return _distance(
        value,
        unit,
        DistanceMethod.ROUTE,
        origin=origin,
        destination=destination,
    )


def straight_line_distance(
    value: float,
    unit: str | DistanceUnit = DistanceUnit.KILOMETER,
    *,
    origin: str | None = None,
    destination: str | None = None,
) -> Distance:
    """Create a clearly warned straight-line fallback distance."""
    return _distance(
        value,
        unit,
        DistanceMethod.STRAIGHT_LINE,
        origin=origin,
        destination=destination,
    )
