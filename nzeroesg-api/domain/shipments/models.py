"""Framework-independent shipment records and validation issues."""

from dataclasses import dataclass


@dataclass(frozen=True)
class ValidationIssue:
    row_number: int | None
    field: str | None
    message: str

    def to_dict(self) -> dict[str, int | str | None]:
        return {
            "row_number": self.row_number,
            "field": self.field,
            "message": self.message,
        }


@dataclass(frozen=True)
class NormalizedShipment:
    shipment_id: str
    origin: str
    destination: str
    weight_kg: float
    distance_km: float
    transport_method: str
    source_row: int

    def to_dict(self) -> dict[str, int | float | str]:
        return {
            "shipment_id": self.shipment_id,
            "origin": self.origin,
            "destination": self.destination,
            "weight_kg": self.weight_kg,
            "distance_km": self.distance_km,
            "transport_method": self.transport_method,
            "source_row": self.source_row,
        }
