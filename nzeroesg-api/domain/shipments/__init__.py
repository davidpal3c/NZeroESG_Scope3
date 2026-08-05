"""Shipment ingestion and deterministic baseline analysis."""

from domain.shipments.analysis import ShipmentAnalysis, analyze_shipments
from domain.shipments.ingestion import (
    MAX_FILE_BYTES,
    MAX_ROWS,
    ShipmentParseResult,
    parse_shipments_csv,
)
from domain.shipments.models import NormalizedShipment, ValidationIssue

__all__ = [
    "MAX_FILE_BYTES",
    "MAX_ROWS",
    "NormalizedShipment",
    "ShipmentAnalysis",
    "ShipmentParseResult",
    "ValidationIssue",
    "analyze_shipments",
    "parse_shipments_csv",
]
