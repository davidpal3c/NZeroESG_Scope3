"""Bounded, row-level CSV shipment validation."""

from __future__ import annotations

import csv
import io
import math
from dataclasses import dataclass

from domain.emissions.modes import normalize_mode
from domain.emissions.units import normalize_distance_km, normalize_weight_kg
from domain.shipments.models import NormalizedShipment, ValidationIssue

MAX_FILE_BYTES = 10 * 1024 * 1024
MAX_ROWS = 500
REQUIRED_HEADERS = (
    "shipment_id",
    "origin",
    "destination",
    "weight_value",
    "weight_unit",
    "distance_value",
    "distance_unit",
    "transport_method",
)
ALLOWED_CONTENT_TYPES = {"text/csv", "application/csv", "text/plain"}


@dataclass(frozen=True)
class ShipmentParseResult:
    rows: tuple[NormalizedShipment, ...]
    errors: tuple[ValidationIssue, ...]
    warnings: tuple[str, ...]

    def to_dict(self) -> dict[str, object]:
        return {
            "rows": [row.to_dict() for row in self.rows],
            "errors": [error.to_dict() for error in self.errors],
            "warnings": list(self.warnings),
        }


def _issue(
    errors: list[ValidationIssue],
    *,
    row_number: int | None,
    field: str | None,
    message: str,
) -> None:
    errors.append(ValidationIssue(row_number=row_number, field=field, message=message))


def _cell(row: dict[str | None, str | list[str] | None], field: str) -> str:
    value = row.get(field)
    if not isinstance(value, str):
        return ""
    return value.strip()


def _validate_text(
    value: str,
    *,
    field: str,
    row_number: int,
    max_length: int,
    errors: list[ValidationIssue],
) -> str | None:
    if not value:
        _issue(errors, row_number=row_number, field=field, message="Value is required.")
        return None
    if "\x00" in value:
        _issue(
            errors,
            row_number=row_number,
            field=field,
            message="NUL characters are not allowed.",
        )
        return None
    if len(value) > max_length:
        _issue(
            errors,
            row_number=row_number,
            field=field,
            message=f"Value must be {max_length} characters or fewer.",
        )
        return None
    if any(ord(character) < 32 and character not in "\t" for character in value):
        _issue(
            errors,
            row_number=row_number,
            field=field,
            message="Control characters are not allowed.",
        )
        return None
    return value


def _parse_positive_number(
    value: str,
    *,
    field: str,
    row_number: int,
    errors: list[ValidationIssue],
) -> float | None:
    if not value:
        _issue(errors, row_number=row_number, field=field, message="Value is required.")
        return None
    try:
        number = float(value)
    except ValueError:
        number = math.nan
    if not math.isfinite(number) or number <= 0:
        _issue(
            errors,
            row_number=row_number,
            field=field,
            message="Value must be a finite positive number.",
        )
        return None
    return number


def parse_shipments_csv(
    content: bytes,
    *,
    content_type: str | None = None,
    filename: str | None = None,
) -> ShipmentParseResult:
    """Parse one bounded CSV document without discarding valid rows."""
    errors: list[ValidationIssue] = []
    warnings: list[str] = []
    rows: list[NormalizedShipment] = []

    if len(content) > MAX_FILE_BYTES:
        _issue(
            errors,
            row_number=None,
            field=None,
            message=f"File exceeds the {MAX_FILE_BYTES // (1024 * 1024)} MB limit.",
        )
        return ShipmentParseResult(rows=(), errors=tuple(errors), warnings=())
    if content_type:
        media_type = content_type.split(";", 1)[0].strip().lower()
        if media_type not in ALLOWED_CONTENT_TYPES:
            _issue(
                errors,
                row_number=None,
                field=None,
                message="File must use a CSV-compatible content type.",
            )
            return ShipmentParseResult(rows=(), errors=tuple(errors), warnings=())
    if filename and not filename.lower().endswith(".csv"):
        _issue(
            errors,
            row_number=None,
            field=None,
            message="File name must end with .csv.",
        )
        return ShipmentParseResult(rows=(), errors=tuple(errors), warnings=())
    if b"\x00" in content:
        _issue(
            errors,
            row_number=None,
            field=None,
            message="NUL characters are not allowed in CSV content.",
        )
        return ShipmentParseResult(rows=(), errors=tuple(errors), warnings=())

    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        _issue(
            errors,
            row_number=None,
            field=None,
            message="CSV must be valid UTF-8 text.",
        )
        return ShipmentParseResult(rows=(), errors=tuple(errors), warnings=())

    try:
        reader = csv.DictReader(io.StringIO(text, newline=""), strict=True)
        headers = reader.fieldnames
        if not headers:
            _issue(errors, row_number=None, field=None, message="CSV must include a header row.")
            return ShipmentParseResult(rows=(), errors=tuple(errors), warnings=())
        normalized_headers = [header.strip().lower() for header in headers if header is not None]
        duplicate_headers = {
            header for header in normalized_headers if normalized_headers.count(header) > 1
        }
        if duplicate_headers:
            _issue(
                errors,
                row_number=1,
                field=None,
                message="CSV headers must be unique.",
            )
            return ShipmentParseResult(rows=(), errors=tuple(errors), warnings=())
        missing_headers = [
            header for header in REQUIRED_HEADERS if header not in normalized_headers
        ]
        if missing_headers:
            _issue(
                errors,
                row_number=1,
                field=None,
                message=f"Missing required headers: {', '.join(missing_headers)}.",
            )
            return ShipmentParseResult(rows=(), errors=tuple(errors), warnings=())
        ignored_headers = [
            header for header in normalized_headers if header not in REQUIRED_HEADERS
        ]
        if ignored_headers:
            warnings.append(f"Ignored optional columns: {', '.join(ignored_headers)}.")

        for row_number, row in enumerate(reader, start=2):
            if row_number - 1 > MAX_ROWS:
                _issue(
                    errors,
                    row_number=row_number,
                    field=None,
                    message=f"CSV cannot contain more than {MAX_ROWS} data rows.",
                )
                break
            if None in row:
                _issue(
                    errors,
                    row_number=row_number,
                    field=None,
                    message="Row contains more values than the header allows.",
                )
                continue
            normalized_row = {
                key.strip().lower(): value for key, value in row.items() if key is not None
            }
            row_errors: list[ValidationIssue] = []
            shipment_id = _validate_text(
                _cell(normalized_row, "shipment_id"),
                field="shipment_id",
                row_number=row_number,
                max_length=80,
                errors=row_errors,
            )
            origin = _validate_text(
                _cell(normalized_row, "origin"),
                field="origin",
                row_number=row_number,
                max_length=200,
                errors=row_errors,
            )
            destination = _validate_text(
                _cell(normalized_row, "destination"),
                field="destination",
                row_number=row_number,
                max_length=200,
                errors=row_errors,
            )
            weight_value = _parse_positive_number(
                _cell(normalized_row, "weight_value"),
                field="weight_value",
                row_number=row_number,
                errors=row_errors,
            )
            distance_value = _parse_positive_number(
                _cell(normalized_row, "distance_value"),
                field="distance_value",
                row_number=row_number,
                errors=row_errors,
            )
            weight_unit = _cell(normalized_row, "weight_unit")
            distance_unit = _cell(normalized_row, "distance_unit")
            transport_method = _cell(normalized_row, "transport_method")
            try:
                weight_kg = (
                    normalize_weight_kg(weight_value, weight_unit)
                    if weight_value is not None
                    else None
                )
            except ValueError:
                weight_kg = None
                _issue(
                    row_errors,
                    row_number=row_number,
                    field="weight_unit",
                    message="Unsupported weight unit.",
                )
            try:
                distance_km = (
                    normalize_distance_km(distance_value, distance_unit)
                    if distance_value is not None
                    else None
                )
            except ValueError:
                distance_km = None
                _issue(
                    row_errors,
                    row_number=row_number,
                    field="distance_unit",
                    message="Unsupported distance unit.",
                )
            try:
                normalized_mode = normalize_mode(transport_method).value
            except ValueError:
                normalized_mode = None
                _issue(
                    row_errors,
                    row_number=row_number,
                    field="transport_method",
                    message="Unsupported transport mode.",
                )
            if row_errors:
                errors.extend(row_errors)
                continue
            rows.append(
                NormalizedShipment(
                    shipment_id=shipment_id,
                    origin=origin,
                    destination=destination,
                    weight_kg=weight_kg,
                    distance_km=distance_km,
                    transport_method=normalized_mode,
                    source_row=row_number,
                )
            )
    except csv.Error:
        _issue(
            errors,
            row_number=None,
            field=None,
            message="CSV structure is invalid or malformed.",
        )

    if errors and rows:
        warnings.append("Some input rows were rejected; totals include accepted rows only.")
    if not rows:
        warnings.append("No valid shipment rows were accepted.")
    return ShipmentParseResult(rows=tuple(rows), errors=tuple(errors), warnings=tuple(warnings))
