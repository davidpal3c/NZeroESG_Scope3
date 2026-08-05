"""Framework-independent supplier and evidence records."""

from dataclasses import dataclass


@dataclass(frozen=True)
class SupplierMetadata:
    name: str
    region: str | None
    certifications: tuple[str, ...]
    transport_modes: tuple[str, ...]


@dataclass(frozen=True)
class EvidenceChunk:
    chunk_index: int
    content: str
    page_number: int | None
    section: str | None


@dataclass(frozen=True)
class EvidenceDocument:
    filename: str
    media_type: str
    sha256: str
    page_count: int
    extracted_chars: int
    chunks: tuple[EvidenceChunk, ...]


@dataclass(frozen=True)
class SupplierCard:
    supplier_id: str
    name: str
    region: str | None
    certifications: tuple[str, ...]
    transport_modes: tuple[str, ...]
    document_count: int
    missing_fields: tuple[str, ...]

    def to_dict(self) -> dict[str, object]:
        return {
            "supplier_id": self.supplier_id,
            "name": self.name,
            "region": self.region,
            "certifications": list(self.certifications),
            "transport_modes": list(self.transport_modes),
            "document_count": self.document_count,
            "missing_fields": list(self.missing_fields),
        }


@dataclass(frozen=True)
class EvidenceMatch:
    supplier_name: str
    filename: str
    excerpt: str
    page_number: int | None
    chunk_index: int
    document_sha256: str

    def to_dict(self) -> dict[str, object]:
        return {
            "supplier_name": self.supplier_name,
            "filename": self.filename,
            "excerpt": self.excerpt,
            "citation": {
                "page_number": self.page_number,
                "chunk_index": self.chunk_index,
                "document_sha256": self.document_sha256,
                "filename": self.filename,
            },
        }
