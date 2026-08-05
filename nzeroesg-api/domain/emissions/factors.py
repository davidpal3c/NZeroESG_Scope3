"""Versioned, inspectable freight-emissions factors."""

from dataclasses import dataclass

from domain.emissions.modes import FreightMode, normalize_mode


@dataclass(frozen=True)
class EmissionFactor:
    """A factor record with enough provenance for a displayed result."""

    mode: FreightMode
    value: float
    source: str
    version: str
    geography: str
    year: int
    applicability: str
    assumptions: tuple[str, ...]
    unit: str = "kg CO2e / tonne-km"

    def to_dict(self) -> dict[str, object]:
        return {
            "value": self.value,
            "unit": self.unit,
            "source": self.source,
            "version": self.version,
            "geography": self.geography,
            "year": self.year,
            "applicability": self.applicability,
            "assumptions": list(self.assumptions),
        }


_FACTOR_SOURCE = "NZeroESG prototype factor schedule"
_FACTOR_VERSION = "prototype-2026.1"
_FACTOR_APPLICABILITY = (
    "Screening estimate for the prototype; replace with an authoritative, "
    "licensed factor set before public carbon accounting use."
)
_FACTOR_ASSUMPTIONS = (
    "Factor is expressed per tonne-kilometre.",
    "Route-specific operating conditions and carrier data are not modeled.",
)

FACTOR_CATALOG: tuple[EmissionFactor, ...] = (
    EmissionFactor(
        mode=FreightMode.PLANE,
        value=0.602,
        source=_FACTOR_SOURCE,
        version=_FACTOR_VERSION,
        geography="global illustrative",
        year=2026,
        applicability=_FACTOR_APPLICABILITY,
        assumptions=_FACTOR_ASSUMPTIONS,
    ),
    EmissionFactor(
        mode=FreightMode.TRUCK,
        value=0.062,
        source=_FACTOR_SOURCE,
        version=_FACTOR_VERSION,
        geography="global illustrative",
        year=2026,
        applicability=_FACTOR_APPLICABILITY,
        assumptions=_FACTOR_ASSUMPTIONS,
    ),
    EmissionFactor(
        mode=FreightMode.TRAIN,
        value=0.022,
        source=_FACTOR_SOURCE,
        version=_FACTOR_VERSION,
        geography="global illustrative",
        year=2026,
        applicability=_FACTOR_APPLICABILITY,
        assumptions=_FACTOR_ASSUMPTIONS,
    ),
    EmissionFactor(
        mode=FreightMode.SHIP,
        value=0.008,
        source=_FACTOR_SOURCE,
        version=_FACTOR_VERSION,
        geography="global illustrative",
        year=2026,
        applicability=_FACTOR_APPLICABILITY,
        assumptions=_FACTOR_ASSUMPTIONS,
    ),
)


def factor_for(
    mode: str | FreightMode,
    *,
    geography: str = "global illustrative",
    year: int = 2026,
) -> EmissionFactor:
    """Select a factor by canonical mode and applicability dimensions."""
    normalized_mode = normalize_mode(mode)
    for factor in FACTOR_CATALOG:
        if factor.mode == normalized_mode and factor.geography == geography and factor.year == year:
            return factor
    raise ValueError(
        f"No emissions factor for mode={normalized_mode.value}, geography={geography}, year={year}"
    )
