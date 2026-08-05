"""Workspace-scoped supplier and evidence persistence with cited search."""

from __future__ import annotations

from contextlib import closing
from typing import Protocol
from uuid import uuid4

try:
    import psycopg
except ImportError:  # pragma: no cover - exercised only before optional local setup
    psycopg = None

from domain.evidence.models import (
    EvidenceDocument,
    EvidenceMatch,
    SupplierCard,
    SupplierMetadata,
)


class EvidenceRepository(Protocol):
    def store(
        self,
        workspace_id: str,
        supplier: SupplierMetadata,
        document: EvidenceDocument,
    ) -> SupplierCard: ...

    def list_suppliers(self, workspace_id: str) -> tuple[SupplierCard, ...]: ...

    def search(self, workspace_id: str, query: str) -> tuple[EvidenceMatch, ...]: ...


def _missing_fields(
    *,
    region: str | None,
    certifications: tuple[str, ...],
    transport_modes: tuple[str, ...],
) -> tuple[str, ...]:
    missing: list[str] = []
    if not region:
        missing.append("region")
    if not certifications:
        missing.append("certifications")
    if not transport_modes:
        missing.append("transport_modes")
    return tuple(missing)


def _card(
    *,
    supplier_id: str,
    supplier: SupplierMetadata,
    document_count: int,
) -> SupplierCard:
    return SupplierCard(
        supplier_id=supplier_id,
        name=supplier.name,
        region=supplier.region,
        certifications=supplier.certifications,
        transport_modes=supplier.transport_modes,
        document_count=document_count,
        missing_fields=_missing_fields(
            region=supplier.region,
            certifications=supplier.certifications,
            transport_modes=supplier.transport_modes,
        ),
    )


class InMemoryEvidenceRepository:
    """Development-only workspace-keyed evidence adapter."""

    def __init__(self) -> None:
        self._suppliers: dict[tuple[str, str], tuple[str, SupplierMetadata, int]] = {}
        self._documents: dict[tuple[str, str], tuple[str, SupplierMetadata, EvidenceDocument]] = {}

    def store(
        self,
        workspace_id: str,
        supplier: SupplierMetadata,
        document: EvidenceDocument,
    ) -> SupplierCard:
        supplier_key = (workspace_id, supplier.name.casefold())
        supplier_id, _, document_count = self._suppliers.get(
            supplier_key,
            (str(uuid4()), supplier, 0),
        )
        document_key = (workspace_id, document.sha256)
        if document_key not in self._documents:
            self._documents[document_key] = (supplier_id, supplier, document)
            document_count += 1
        self._suppliers[supplier_key] = (supplier_id, supplier, document_count)
        return _card(supplier_id=supplier_id, supplier=supplier, document_count=document_count)

    def list_suppliers(self, workspace_id: str) -> tuple[SupplierCard, ...]:
        cards = [
            _card(supplier_id=supplier_id, supplier=supplier, document_count=document_count)
            for (record_workspace, _), (
                supplier_id,
                supplier,
                document_count,
            ) in self._suppliers.items()
            if record_workspace == workspace_id
        ]
        return tuple(sorted(cards, key=lambda card: card.name.casefold()))

    def search(self, workspace_id: str, query: str) -> tuple[EvidenceMatch, ...]:
        terms = {term.casefold() for term in query.split() if term.strip()}
        matches: list[tuple[int, EvidenceMatch]] = []
        for (record_workspace, _), (_supplier_id, supplier, document) in self._documents.items():
            if record_workspace != workspace_id:
                continue
            for chunk in document.chunks:
                content_terms = set(chunk.content.casefold().split())
                score = len(terms & content_terms)
                if score:
                    matches.append(
                        (
                            score,
                            EvidenceMatch(
                                supplier_name=supplier.name,
                                filename=document.filename,
                                excerpt=chunk.content,
                                page_number=chunk.page_number,
                                chunk_index=chunk.chunk_index,
                                document_sha256=document.sha256,
                            ),
                        )
                    )
        return tuple(match for _, match in sorted(matches, key=lambda item: -item[0])[:20])


class PostgresEvidenceRepository:
    """PostgreSQL full-text evidence repository."""

    def __init__(self, database_url: str) -> None:
        if psycopg is None:
            raise RuntimeError("psycopg is required when DATABASE_URL is configured.")
        self.database_url = database_url

    def _connect(self):
        return psycopg.connect(self.database_url)

    def store(
        self,
        workspace_id: str,
        supplier: SupplierMetadata,
        document: EvidenceDocument,
    ) -> SupplierCard:
        with closing(self._connect()) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO suppliers
                        (supplier_id, workspace_id, name, region, certifications, transport_modes)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (workspace_id, name)
                    DO UPDATE SET region = EXCLUDED.region,
                                  certifications = EXCLUDED.certifications,
                                  transport_modes = EXCLUDED.transport_modes,
                                  updated_at = CURRENT_TIMESTAMP
                    RETURNING supplier_id
                    """,
                    (
                        str(uuid4()),
                        workspace_id,
                        supplier.name,
                        supplier.region,
                        list(supplier.certifications),
                        list(supplier.transport_modes),
                    ),
                )
                supplier_id = str(cursor.fetchone()[0])
                cursor.execute(
                    """
                    SELECT document_id FROM evidence_documents
                    WHERE workspace_id = %s AND sha256 = %s
                    """,
                    (workspace_id, document.sha256),
                )
                existing = cursor.fetchone()
                if existing is None:
                    document_id = str(uuid4())
                    cursor.execute(
                        """
                        INSERT INTO evidence_documents
                            (document_id, workspace_id, supplier_id, filename, media_type,
                             sha256, page_count, extracted_chars)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            document_id,
                            workspace_id,
                            supplier_id,
                            document.filename,
                            document.media_type,
                            document.sha256,
                            document.page_count,
                            document.extracted_chars,
                        ),
                    )
                    cursor.executemany(
                        """
                        INSERT INTO evidence_chunks
                            (chunk_id, workspace_id, document_id, supplier_id,
                             chunk_index, page_number, section, content)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        [
                            (
                                str(uuid4()),
                                workspace_id,
                                document_id,
                                supplier_id,
                                chunk.chunk_index,
                                chunk.page_number,
                                chunk.section,
                                chunk.content,
                            )
                            for chunk in document.chunks
                        ],
                    )
                cursor.execute(
                    """
                    SELECT COUNT(*) FROM evidence_documents
                    WHERE workspace_id = %s AND supplier_id = %s
                    """,
                    (workspace_id, supplier_id),
                )
                document_count = cursor.fetchone()[0]
            connection.commit()
        return _card(supplier_id=supplier_id, supplier=supplier, document_count=document_count)

    def list_suppliers(self, workspace_id: str) -> tuple[SupplierCard, ...]:
        with closing(self._connect()) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT s.supplier_id, s.name, s.region, s.certifications,
                           s.transport_modes, COUNT(d.document_id)
                    FROM suppliers AS s
                    LEFT JOIN evidence_documents AS d
                        ON d.supplier_id = s.supplier_id
                       AND d.workspace_id = s.workspace_id
                    WHERE s.workspace_id = %s
                    GROUP BY s.supplier_id, s.name, s.region, s.certifications, s.transport_modes
                    ORDER BY s.name
                    """,
                    (workspace_id,),
                )
                rows = cursor.fetchall()
        return tuple(
            _card(
                supplier_id=str(row[0]),
                supplier=SupplierMetadata(
                    name=row[1],
                    region=row[2],
                    certifications=tuple(row[3] or ()),
                    transport_modes=tuple(row[4] or ()),
                ),
                document_count=row[5],
            )
            for row in rows
        )

    def search(self, workspace_id: str, query: str) -> tuple[EvidenceMatch, ...]:
        with closing(self._connect()) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT s.name, d.filename, c.content, c.page_number,
                           c.chunk_index, d.sha256,
                           ts_rank(c.search_vector, plainto_tsquery('english', %s)) AS rank
                    FROM evidence_chunks AS c
                    JOIN evidence_documents AS d
                        ON d.document_id = c.document_id
                       AND d.workspace_id = c.workspace_id
                    JOIN suppliers AS s
                        ON s.supplier_id = c.supplier_id
                       AND s.workspace_id = c.workspace_id
                    WHERE c.workspace_id = %s
                      AND c.search_vector @@ plainto_tsquery('english', %s)
                    ORDER BY rank DESC, c.chunk_index
                    LIMIT 20
                    """,
                    (query, workspace_id, query),
                )
                rows = cursor.fetchall()
        return tuple(
            EvidenceMatch(
                supplier_name=row[0],
                filename=row[1],
                excerpt=row[2],
                page_number=row[3],
                chunk_index=row[4],
                document_sha256=row[5],
            )
            for row in rows
        )


def build_evidence_repository(database_url: str | None) -> EvidenceRepository:
    if database_url:
        return PostgresEvidenceRepository(database_url)
    return InMemoryEvidenceRepository()
