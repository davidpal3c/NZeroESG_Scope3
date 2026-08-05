"""Typed HTTP boundary for bounded shipment CSV ingestion."""

from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from api.workspaces import require_workspace_session, workspace_repository
from config import database_url_for_runtime
from domain.shipments.analysis import ShipmentAnalysis, analyze_shipments
from domain.shipments.ingestion import (
    ALLOWED_CONTENT_TYPES,
    MAX_FILE_BYTES,
    parse_shipments_csv,
)
from domain.shipments.models import NormalizedShipment
from domain.workspaces.sessions import WorkspaceSession
from persistence.shipments import build_shipment_repository
from persistence.workspaces import QuotaExceededError, WorkspaceNotFoundError

shipments_router = APIRouter(prefix="/shipments", tags=["shipments"])
shipment_repository = build_shipment_repository(database_url_for_runtime())


class ShipmentErrorResponse(BaseModel):
    row_number: int | None
    field: str | None
    message: str


class ShipmentRowResponse(BaseModel):
    shipment_id: str
    origin: str
    destination: str
    weight_kg: float
    distance_km: float
    transport_method: str
    source_row: int


class ModeBreakdownResponse(BaseModel):
    shipment_count: int
    weight_kg: float
    emissions_kg: float


class HotspotResponse(BaseModel):
    shipment_id: str
    origin: str
    destination: str
    transport_method: str
    emissions_kg: float


class ShipmentAnalysisResponse(BaseModel):
    shipment_count: int
    total_weight_kg: float
    total_emissions_kg: float
    total_emissions_tonnes: float
    mode_breakdown: dict[str, ModeBreakdownResponse]
    hotspots: list[HotspotResponse]
    warnings: list[str]
    factor_source: str
    factor_version: str
    factor_applicability: str
    assumptions: list[str]


class ShipmentUploadResponse(BaseModel):
    accepted_rows: int
    errors: list[ShipmentErrorResponse]
    warnings: list[str]
    rows: list[ShipmentRowResponse]
    analysis: ShipmentAnalysisResponse


def _analysis_response(analysis: ShipmentAnalysis) -> ShipmentAnalysisResponse:
    return ShipmentAnalysisResponse.model_validate(analysis.to_dict())


def _shipment_response(shipment: NormalizedShipment) -> ShipmentRowResponse:
    return ShipmentRowResponse.model_validate(shipment.to_dict())


def _response(
    rows: tuple[NormalizedShipment, ...],
    *,
    errors: tuple[dict[str, object], ...] = (),
    warnings: tuple[str, ...] = (),
) -> ShipmentUploadResponse:
    analysis = analyze_shipments(rows, parser_warnings=warnings)
    return ShipmentUploadResponse(
        accepted_rows=len(rows),
        errors=[ShipmentErrorResponse.model_validate(error) for error in errors],
        warnings=list(analysis.warnings),
        rows=[_shipment_response(row) for row in rows],
        analysis=_analysis_response(analysis),
    )


def _consume_analysis_run(workspace_id: str) -> None:
    try:
        workspace_repository.consume_quota(workspace_id, "analysis_runs_per_day")
    except WorkspaceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The workspace session is no longer active.",
        ) from exc
    except QuotaExceededError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="The daily analysis quota for this workspace has been reached.",
        ) from exc


@shipments_router.post("/upload", response_model=ShipmentUploadResponse)
async def upload_shipments(
    file: Annotated[UploadFile, File(description="A UTF-8 shipment CSV")],
    workspace: Annotated[WorkspaceSession, Depends(require_workspace_session)],
) -> ShipmentUploadResponse:
    media_type = (file.content_type or "").split(";", 1)[0].strip().lower()
    if media_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="File must use a CSV-compatible content type.",
        )
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="File name must end with .csv.",
        )
    content = await file.read(MAX_FILE_BYTES + 1)
    parsed = parse_shipments_csv(
        content,
        content_type=media_type,
        filename=file.filename,
    )
    if parsed.rows:
        _consume_analysis_run(workspace.workspace_id)
        shipment_repository.replace_for_workspace(workspace.workspace_id, parsed.rows)
    return _response(
        parsed.rows,
        errors=tuple(error.to_dict() for error in parsed.errors),
        warnings=parsed.warnings,
    )


@shipments_router.get("", response_model=ShipmentUploadResponse)
async def list_shipments(
    workspace: Annotated[WorkspaceSession, Depends(require_workspace_session)],
) -> ShipmentUploadResponse:
    rows = shipment_repository.list_for_workspace(workspace.workspace_id)
    return _response(rows)
