"""Supported freight modes and input normalization."""

from enum import Enum


class FreightMode(str, Enum):
    """Canonical modes supported by the prototype calculation core."""

    PLANE = "plane"
    TRUCK = "truck"
    TRAIN = "train"
    SHIP = "ship"


SUPPORTED_FREIGHT_MODES: tuple[FreightMode, ...] = tuple(FreightMode)

_MODE_ALIASES: dict[str, FreightMode] = {
    "plane": FreightMode.PLANE,
    "air": FreightMode.PLANE,
    "air freight": FreightMode.PLANE,
    "truck": FreightMode.TRUCK,
    "road": FreightMode.TRUCK,
    "train": FreightMode.TRAIN,
    "rail": FreightMode.TRAIN,
    "ship": FreightMode.SHIP,
    "ocean": FreightMode.SHIP,
    "ocean container": FreightMode.SHIP,
}


def normalize_mode(mode: str | FreightMode) -> FreightMode:
    """Return the canonical mode for a supported user-facing alias."""
    if isinstance(mode, FreightMode):
        return mode

    normalized = " ".join(mode.strip().lower().split())
    try:
        return _MODE_ALIASES[normalized]
    except KeyError as exc:
        raise ValueError(f"Unsupported transport mode: {mode}") from exc
