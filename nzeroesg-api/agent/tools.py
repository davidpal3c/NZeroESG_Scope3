from typing import Literal

import requests
from geopy.distance import geodesic
from geopy.geocoders import Nominatim
from langchain.tools import StructuredTool
from pydantic import BaseModel, Field

from config import settings
from domain.emissions.calculator import calculate_emissions as deterministic_calculate
from domain.emissions.distance import DistanceMethod
from domain.emissions.factors import FACTOR_CATALOG
from domain.emissions.units import (
    normalize_distance_km as deterministic_distance_km,
)
from domain.emissions.units import (
    normalize_weight_kg as deterministic_weight_kg,
)

TransportMode = Literal["plane", "air", "truck", "train", "ship", "ocean container"]

# Compatibility map derived from the versioned deterministic factor catalog.
FALLBACK_EMISSION_FACTORS: dict[str, float] = {
    factor.mode.value: factor.value for factor in FACTOR_CATALOG
}


class DistanceInput(BaseModel):
    origin: str = Field(min_length=2, description="Origin city or location")
    destination: str = Field(min_length=2, description="Destination city or location")


class ShippingEmissionsInput(BaseModel):
    weight_value: float = Field(gt=0, description="Shipment weight")
    weight_unit: Literal["g", "kg", "lb", "mt"] = "kg"
    distance_value: float = Field(gt=0, description="Shipment distance")
    distance_unit: Literal["m", "km", "mi"] = "km"
    transport_method: TransportMode


class CompareInput(BaseModel):
    weight_value: float = Field(gt=0, description="Shipment weight")
    transport_method: list[TransportMode] = Field(min_length=2)
    weight_unit: Literal["g", "kg", "lb", "mt"] = "kg"
    distance_unit: Literal["m", "km", "mi"] = "km"
    distance_value: float | None = Field(default=None, gt=0)
    origin: str | None = None
    destination: str | None = None


def normalize_weight_kg(value: float, unit: str) -> float:
    return deterministic_weight_kg(value, unit)


def normalize_distance_km(value: float, unit: str) -> float:
    return deterministic_distance_km(value, unit)


def fallback_emission_estimate(
    weight: float,
    distance: float,
    method: str,
    weight_unit: str = "kg",
    distance_unit: str = "km",
    distance_method: DistanceMethod = DistanceMethod.ROUTE,
) -> dict[str, object]:
    return deterministic_calculate(
        weight_value=weight,
        weight_unit=weight_unit,
        distance_value=distance,
        distance_unit=distance_unit,
        mode=method,
        distance_method=distance_method,
    ).to_dict()


def resolve_distance(origin: str, destination: str) -> dict[str, float | str]:
    geolocator = Nominatim(user_agent="carbonsage-prototype")
    origin_location = geolocator.geocode(origin, timeout=10)
    destination_location = geolocator.geocode(destination, timeout=10)

    if not origin_location or not destination_location:
        raise ValueError("Could not resolve one or both locations.")

    distance_km = geodesic(
        (origin_location.latitude, origin_location.longitude),
        (destination_location.latitude, destination_location.longitude),
    ).km
    return {
        "origin": origin,
        "destination": destination,
        "distance_km": round(distance_km, 1),
        "distance_method": "geodesic",
        "warning": "This is straight-line distance, not a mode-specific route.",
    }


def calculate_shipping_emissions(
    weight_value: float,
    distance_value: float,
    transport_method: str,
    weight_unit: str = "kg",
    distance_unit: str = "km",
    distance_method: DistanceMethod = DistanceMethod.ROUTE,
) -> dict[str, object]:
    fallback = fallback_emission_estimate(
        weight=weight_value,
        distance=distance_value,
        method=transport_method,
        weight_unit=weight_unit,
        distance_unit=distance_unit,
        distance_method=distance_method,
    )

    if not settings.carbon_interface_api_key:
        return fallback

    payload = {
        "type": "shipping",
        "weight_value": weight_value,
        "weight_unit": weight_unit,
        "distance_value": distance_value,
        "distance_unit": distance_unit,
        "transport_method": transport_method.lower(),
    }
    try:
        response = requests.post(
            "https://www.carboninterface.com/api/v1/estimates",
            headers={
                "Authorization": f"Bearer {settings.carbon_interface_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=15,
        )
        response.raise_for_status()
        attributes = response.json()["data"]["attributes"]
        emissions_kg = float(attributes["carbon_kg"])
    except (KeyError, TypeError, ValueError, requests.RequestException):
        return fallback

    return {
        "method": str(attributes.get("transport_method", transport_method)).lower(),
        "emissions_kg": emissions_kg,
        "emissions_tonnes": float(attributes.get("carbon_mt") or round(emissions_kg / 1_000, 6)),
        "weight_kg": round(normalize_weight_kg(weight_value, weight_unit), 3),
        "distance_km": round(normalize_distance_km(distance_value, distance_unit), 3),
        "source": "Carbon Interface API",
        "data_quality": "provider_estimate",
    }


def compare_emissions(
    weight_value: float,
    transport_method: list[str],
    weight_unit: str = "kg",
    distance_unit: str = "km",
    distance_value: float | None = None,
    origin: str | None = None,
    destination: str | None = None,
) -> dict[str, object]:
    resolved_distance = distance_value
    resolved_distance_method = DistanceMethod.ROUTE
    if resolved_distance is None and origin and destination:
        resolved_distance = float(resolve_distance(origin, destination)["distance_km"])
        distance_unit = "km"
        resolved_distance_method = DistanceMethod.STRAIGHT_LINE
    if resolved_distance is None:
        raise ValueError("Provide a distance or both origin and destination.")

    results = {
        method: calculate_shipping_emissions(
            weight_value=weight_value,
            distance_value=resolved_distance,
            transport_method=method,
            weight_unit=weight_unit,
            distance_unit=distance_unit,
            distance_method=resolved_distance_method,
        )
        for method in transport_method
    }
    lowest_method = min(
        results,
        key=lambda method: float(results[method]["emissions_kg"]),
    )

    return {
        "summary": (
            f"{lowest_method.capitalize()} has the lowest estimated footprint for this shipment."
        ),
        "lowest_emissions_method": lowest_method,
        "details": results,
    }


distance_tool = StructuredTool.from_function(
    name="DistanceResolver",
    func=resolve_distance,
    args_schema=DistanceInput,
    description=(
        "Resolve straight-line distance between two locations. The result is "
        "not a mode-specific route."
    ),
)

emissions_tool = StructuredTool.from_function(
    name="EmissionsCalculator",
    func=calculate_shipping_emissions,
    args_schema=ShippingEmissionsInput,
    description="Estimate freight emissions for one transport mode.",
)

compare_shipping_emissions = StructuredTool.from_function(
    name="OptionComparer",
    func=compare_emissions,
    args_schema=CompareInput,
    description="Compare estimated freight emissions across transport modes.",
)
