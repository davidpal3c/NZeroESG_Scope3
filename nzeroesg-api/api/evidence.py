"""Typed HTTP boundary for supplier evidence ingestion and retrieval."""

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from pydantic import BaseModel

from api.workspaces import require_workspace_session, workspace_repository
from config import database_url_for_runtime
from domain.evidence.ingestion import (
    MAX_FILE_BYTES,
    EvidenceIngestionError,
    extract_evidence,
    normalize_supplier_metadata,
)
from domain.evidence.models import EvidenceMatch, SupplierCard, SupplierMetadata
from domain.workspaces.sessions import WorkspaceSession
from persistence.evidence import build_evidence_repository
from persistence.workspaces import QuotaExceededError, WorkspaceNotFoundError

evidence_router = APIRouter(tags=["evidence"])
evidence_repository = build_evidence_repository(database_url_for_runtime())


class SupplierResponse(BaseModel):
    supplier_id: str
    name: str
    region: str | None
    certifications: list[str]
    transport_modes: list[str]
    document_count: int
    missing_fields: list[str]


class CitationResponse(BaseModel):
    page_number: int | None
    chunk_index: int
    document_sha256: str
    filename: str


class EvidenceMatchResponse(BaseModel):
    supplier_name: str
    filename: str
    excerpt: str
    citation: CitationResponse


class EvidenceUploadResponse(BaseModel):
    supplier: SupplierResponse
    filename: str
    media_type: str
    sha256: str
    page_count: int
    extracted_chars: int
    chunk_count: int


class SupplierListResponse(BaseModel):
    suppliers: list[SupplierResponse]


class EvidenceSearchResponse(BaseModel):
    query: str
    matches: list[EvidenceMatchResponse]


def _supplier_response(supplier: SupplierCard) -> SupplierResponse:
    return SupplierResponse.model_validate(supplier.to_dict())


def _match_response(match: EvidenceMatch) -> EvidenceMatchResponse:
    return EvidenceMatchResponse.model_validate(match.to_dict())


def _consume_document_quota(workspace_id: str) -> None:
    try:
        workspace_repository.consume_quota(workspace_id, "evidence_documents")
    except WorkspaceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The workspace session is no longer active.",
        ) from exc
    except QuotaExceededError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="The evidence document quota for this workspace has been reached.",
        ) from exc


@evidence_router.post("/evidence/upload", response_model=EvidenceUploadResponse)
async def upload_evidence(
    file: Annotated[UploadFile, File(description="A UTF-8 TXT or text-based PDF")],
    supplier_name: Annotated[str, Form()],
    workspace: Annotated[WorkspaceSession, Depends(require_workspace_session)],
    supplier_region: Annotated[str | None, Form()] = None,
    certifications: Annotated[str | None, Form()] = None,
    transport_modes: Annotated[str | None, Form()] = None,
) -> EvidenceUploadResponse:
    try:
        normalized_supplier = normalize_supplier_metadata(
            name=supplier_name,
            region=supplier_region,
            certifications=certifications,
            transport_modes=transport_modes,
        )
        content = await file.read(MAX_FILE_BYTES + 1)
        extraction = extract_evidence(
            content,
            filename=file.filename or "evidence",
            content_type=file.content_type or "",
        )
    except EvidenceIngestionError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    supplier = SupplierMetadata(
        name=normalized_supplier[0],
        region=normalized_supplier[1],
        certifications=normalized_supplier[2],
        transport_modes=normalized_supplier[3],
    )
    _consume_document_quota(workspace.workspace_id)
    stored_supplier = evidence_repository.store(
        workspace.workspace_id,
        supplier,
        extraction.document,
    )
    return EvidenceUploadResponse(
        supplier=_supplier_response(stored_supplier),
        filename=extraction.document.filename,
        media_type=extraction.document.media_type,
        sha256=extraction.document.sha256,
        page_count=extraction.document.page_count,
        extracted_chars=extraction.document.extracted_chars,
        chunk_count=len(extraction.document.chunks),
    )


@evidence_router.get("/suppliers", response_model=SupplierListResponse)
async def list_suppliers(
    workspace: Annotated[WorkspaceSession, Depends(require_workspace_session)],
) -> SupplierListResponse:
    return SupplierListResponse(
        suppliers=[
            _supplier_response(supplier)
            for supplier in evidence_repository.list_suppliers(workspace.workspace_id)
        ]
    )


@evidence_router.get("/evidence/search", response_model=EvidenceSearchResponse)
async def search_evidence(
    query: Annotated[str, Query(min_length=2, max_length=200)],
    workspace: Annotated[WorkspaceSession, Depends(require_workspace_session)],
) -> EvidenceSearchResponse:
    normalized_query = query.strip()
    if len(normalized_query) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Evidence search query must contain at least two characters.",
        )
    return EvidenceSearchResponse(
        query=normalized_query,
        matches=[
            _match_response(match)
            for match in evidence_repository.search(workspace.workspace_id, normalized_query)
        ],
    )
