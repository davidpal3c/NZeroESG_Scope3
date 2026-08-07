"""Printable report preview and CSV export over typed workspace state."""

from __future__ import annotations

import csv
import io
import time
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel

from api.evidence import evidence_repository
from api.shipments import shipment_repository
from api.workspaces import require_workspace_session
from domain.scenarios.comparison import compare_shipment_modes
from domain.shipments.analysis import analyze_shipments
from domain.workspaces.sessions import WorkspaceSession

reports_router = APIRouter(prefix="/reports", tags=["reports"])


class ReportResponse(BaseModel):
    workspace_id: str
    generated_at: int
    shipment_analysis: dict[str, object]
    scenario: dict[str, object] | None
    suppliers: list[dict[str, object]]
    methodology: dict[str, object]


def _build_report(workspace_id: str, alternative_mode: str | None) -> ReportResponse:
    shipments = shipment_repository.list_for_workspace(workspace_id)
    analysis = analyze_shipments(shipments)
    scenario = None
    if alternative_mode:
        try:
            scenario = compare_shipment_modes(
                shipments,
                alternative_mode=alternative_mode,
            ).to_dict()
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            ) from exc
    return ReportResponse(
        workspace_id=workspace_id,
        generated_at=int(time.time()),
        shipment_analysis=analysis.to_dict(),
        scenario=scenario,
        suppliers=[
            supplier.to_dict() for supplier in evidence_repository.list_suppliers(workspace_id)
        ],
        methodology={
            "factor_source": analysis.factor_source,
            "factor_version": analysis.factor_version,
            "factor_applicability": analysis.factor_applicability,
            "assumptions": list(analysis.assumptions),
            "warnings": list(analysis.warnings),
        },
    )


@reports_router.get("/preview", response_model=ReportResponse)
async def report_preview(
    workspace: Annotated[WorkspaceSession, Depends(require_workspace_session)],
    alternative_mode: Annotated[str | None, Query(max_length=30)] = None,
) -> ReportResponse:
    return _build_report(workspace.workspace_id, alternative_mode)


def _safe_csv_cell(value: object) -> str:
    text = str(value)
    if text.startswith(("=", "+", "-", "@")):
        return "'" + text
    return text


@reports_router.get("/export.csv")
async def report_csv(
    workspace: Annotated[WorkspaceSession, Depends(require_workspace_session)],
    alternative_mode: Annotated[str | None, Query(max_length=30)] = None,
) -> Response:
    report = _build_report(workspace.workspace_id, alternative_mode)
    output = io.StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow(("section", "field", "value"))
    writer.writerow(("report", "workspace_id", _safe_csv_cell(report.workspace_id)))
    writer.writerow(("report", "generated_at", report.generated_at))
    for field, value in report.shipment_analysis.items():
        if isinstance(value, dict | list):
            continue
        writer.writerow(("shipment_analysis", field, _safe_csv_cell(value)))
    for mode, breakdown in report.shipment_analysis.get("mode_breakdown", {}).items():
        for field, value in breakdown.items():
            writer.writerow((f"mode:{mode}", field, _safe_csv_cell(value)))
    if report.scenario:
        for field, value in report.scenario.items():
            if isinstance(value, dict | list):
                continue
            writer.writerow(("scenario", field, _safe_csv_cell(value)))
    for supplier in report.suppliers:
        writer.writerow(("supplier", "name", _safe_csv_cell(supplier["name"])))
        writer.writerow(("supplier", "region", _safe_csv_cell(supplier["region"])))
        writer.writerow(("supplier", "document_count", supplier["document_count"]))
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=carbonsage-report.csv"},
    )
