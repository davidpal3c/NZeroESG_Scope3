from io import BytesIO

from pypdf import PdfReader, PdfWriter
from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject

from domain.evidence.ingestion import (
    EvidenceIngestionError,
    extract_evidence,
    normalize_supplier_metadata,
)


def _pdf_with_text(text: str) -> bytes:
    writer = PdfWriter()
    page = writer.add_blank_page(width=612, height=792)
    font = DictionaryObject(
        {
            NameObject("/Type"): NameObject("/Font"),
            NameObject("/Subtype"): NameObject("/Type1"),
            NameObject("/BaseFont"): NameObject("/Helvetica"),
        }
    )
    page[NameObject("/Resources")] = DictionaryObject(
        {NameObject("/Font"): DictionaryObject({NameObject("/F1"): writer._add_object(font)})}
    )
    stream = DecodedStreamObject()
    stream.set_data(f"BT /F1 12 Tf 72 720 Td ({text}) Tj ET".encode())
    page[NameObject("/Contents")] = writer._add_object(stream)
    output = BytesIO()
    writer.write(output)
    return output.getvalue()


def test_text_evidence_is_chunked_with_stable_hash_and_metadata():
    extraction = extract_evidence(
        b"Supplier ABC maintains ISO 14001 certification and operates truck routes.",
        filename="supplier.txt",
        content_type="text/plain",
    )

    document = extraction.document
    assert document.sha256
    assert document.page_count == 1
    assert document.chunks[0].chunk_index == 0
    assert "ISO 14001" in document.chunks[0].content


def test_pdf_evidence_exposes_page_location():
    extraction = extract_evidence(
        _pdf_with_text("Supplier ABC maintains ISO 14001 certification."),
        filename="certificate.pdf",
        content_type="application/pdf",
    )

    assert extraction.document.chunks[0].page_number == 1
    assert "ISO 14001" in extraction.document.chunks[0].content


def test_supplier_metadata_normalizes_modes_and_preserves_missing_fields():
    name, region, certifications, modes = normalize_supplier_metadata(
        name="Supplier ABC",
        region="Canada",
        certifications="ISO 14001,  ISO 9001",
        transport_modes="road, rail",
    )

    assert (name, region) == ("Supplier ABC", "Canada")
    assert certifications == ("ISO 14001", "ISO 9001")
    assert modes == ("truck", "train")


def test_evidence_rejects_unsupported_and_empty_content():
    try:
        extract_evidence(b"not a pdf", filename="evidence.pdf", content_type="application/pdf")
    except EvidenceIngestionError as exc:
        assert "could not be extracted" in str(exc)
    else:
        raise AssertionError("Unsupported PDF content should be rejected")

    try:
        extract_evidence(b"", filename="empty.txt", content_type="text/plain")
    except EvidenceIngestionError as exc:
        assert "No text" in str(exc)
    else:
        raise AssertionError("Empty evidence should be rejected")


def test_generated_pdf_is_readable_by_the_extractor():
    reader = PdfReader(BytesIO(_pdf_with_text("Evidence source")))

    assert reader.pages[0].extract_text().strip() == "Evidence source"
