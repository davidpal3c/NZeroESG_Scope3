"""Typed HTTP boundary for the deterministic emissions core."""

from typing import Literal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from domain.emissions.calculator import (
    CalculationResult,
    ComparisonResult,
    calculate_emissions,
    compare_emissions,
)

TransportMethod = Literal[
    "plane",
    "air",
    "truck",
    "train",
    "ship",
    "ocean container",
]
DistanceMethod = Literal["route", "straight_line"]


class EmissionsRequest(BaseModel):
    weight_value: float = Field(gt=0)
    weight_unit: Literal["g", "kg", "lb", "mt"] = "kg"
    distance_value: float = Field(gt=0)
    distance_unit: Literal["m", "km", "mi"] = "km"
    transport_method: TransportMethod
    distance_method: DistanceMethod = "route"
    origin: str | None = None
    destination: str | None = None


class ComparisonRequest(BaseModel):
    weight_value: float = Field(gt=0)
    weight_unit: Literal["g", "kg", "lb", "mt"] = "kg"
    distance_value: float = Field(gt=0)
    distance_unit: Literal["m", "km", "mi"] = "km"
    transport_method: list[TransportMethod] = Field(min_length=2, max_length=4)
    distance_method: DistanceMethod = "route"
    origin: str | None = None
    destination: str | None = None


class FactorResponse(BaseModel):
    value: float
    unit: str
    source: str
    version: str
    geography: str
    year: int
    applicability: str
    assumptions: list[str]


class DistanceResponse(BaseModel):
    distance_km: float
    method: str
    origin: str | None
    destination: str | None
    warnings: list[str]


class ProvenanceResponse(BaseModel):
    factor: FactorResponse
    distance: DistanceResponse


class CalculationResponse(BaseModel):
    method: str
    emissions_kg: float
    emissions_tonnes: float
    weight_kg: float
    distance_km: float
    distance_method: str
    factor_kg_co2e_per_tonne_km: float
    source: str
    source_version: str
    source_geography: str
    source_year: int
    factor_unit: str
    applicability: str
    assumptions: list[str]
    formula: str
    data_quality: str
    warnings: list[str]
    provenance: ProvenanceResponse


class ComparisonResponse(BaseModel):
    summary: str
    lowest_emissions_method: str
    details: dict[str, CalculationResponse]


emissions_router = APIRouter(prefix="/emissions", tags=["emissions"])


def _calculation_response(result: CalculationResult) -> CalculationResponse:
    return CalculationResponse.model_validate(result.to_dict())


def _raise_calculation_error(exc: ValueError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))


@emissions_router.post("/calculate", response_model=CalculationResponse)
async def calculate(payload: EmissionsRequest) -> CalculationResponse:
    try:
        result = calculate_emissions(
            weight_value=payload.weight_value,
            weight_unit=payload.weight_unit,
            distance_value=payload.distance_value,
            distance_unit=payload.distance_unit,
            mode=payload.transport_method,
            distance_method=payload.distance_method,
            origin=payload.origin,
            destination=payload.destination,
        )
    except ValueError as exc:
        raise _raise_calculation_error(exc) from exc
    return _calculation_response(result)


@emissions_router.post("/compare", response_model=ComparisonResponse)
async def compare(payload: ComparisonRequest) -> ComparisonResponse:
    try:
        result = compare_emissions(
            weight_value=payload.weight_value,
            weight_unit=payload.weight_unit,
            distance_value=payload.distance_value,
            distance_unit=payload.distance_unit,
            modes=payload.transport_method,
            distance_method=payload.distance_method,
            origin=payload.origin,
            destination=payload.destination,
        )
    except ValueError as exc:
        raise _raise_calculation_error(exc) from exc
    return ComparisonResponse.model_validate(_comparison_payload(result))


def _comparison_payload(result: ComparisonResult) -> dict[str, object]:
    return result.to_dict()
