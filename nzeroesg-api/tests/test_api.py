from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def authenticated_client() -> TestClient:
    demo_client = TestClient(app)
    response = demo_client.post("/demo/session")
    assert response.status_code == 201
    return demo_client


def test_health_is_available_without_provider_credentials():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "environment": "development",
        "assistant_enabled": False,
    }
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "no-referrer"


def test_evidence_upload_rejects_oversized_content_before_extraction():
    response = authenticated_client().post(
        "/evidence/upload",
        data={"supplier_name": "Supplier ABC"},
        files={
            "file": (
                "supplier.txt",
                b"x" * (10 * 1024 * 1024 + 1),
                "text/plain",
            )
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "Evidence file exceeds the 10 MB limit."


def test_cors_allows_frontend_workspace_logout():
    response = client.options(
        "/demo/session",
        headers={
            "Origin": "http://127.0.0.1:3000",
            "Access-Control-Request-Method": "DELETE",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:3000"
    assert "DELETE" in response.headers["access-control-allow-methods"]


def test_disabled_assistant_has_an_explicit_response():
    response = client.post("/chat", json={"message": "Compare rail and air."})

    assert response.status_code == 503
    assert response.json()["detail"] == "The optional assistant is disabled in this environment."


def test_chat_request_is_validated_before_provider_work():
    response = client.post("/chat", json={"message": ""})

    assert response.status_code == 422


def test_deterministic_emissions_endpoint_returns_provenance_without_assistant():
    response = authenticated_client().post(
        "/emissions/calculate",
        json={
            "weight_value": 1,
            "weight_unit": "mt",
            "distance_value": 100,
            "distance_unit": "km",
            "transport_method": "train",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["emissions_kg"] == 2.2
    assert payload["source_version"] == "prototype-2026.1"
    assert payload["assumptions"]
    assert payload["provenance"]["distance"]["method"] == "route"


def test_deterministic_comparison_endpoint_orders_modes_and_exposes_warnings():
    response = authenticated_client().post(
        "/emissions/compare",
        json={
            "weight_value": 500,
            "distance_value": 1_000,
            "transport_method": ["plane", "truck", "ship"],
            "distance_method": "straight_line",
            "origin": "Edmonton",
            "destination": "Calgary",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["lowest_emissions_method"] == "ship"
    assert list(payload["details"]) == ["plane", "truck", "ship"]
    assert payload["details"]["ship"]["warnings"]


def test_emissions_endpoint_rejects_direct_calls_without_workspace_session():
    response = TestClient(app).post(
        "/emissions/calculate",
        json={
            "weight_value": 1,
            "distance_value": 100,
            "transport_method": "truck",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "A valid workspace session is required."


def test_demo_sessions_are_isolated_between_browser_clients():
    first_client = authenticated_client()
    second_client = authenticated_client()

    first_session = first_client.get("/demo/session")
    second_session = second_client.get("/demo/session")

    assert first_session.status_code == 200
    assert second_session.status_code == 200
    assert first_session.json()["workspace_id"] != second_session.json()["workspace_id"]
    assert first_session.json()["retention"]["policy"] == "workspace_and_derived_data"


def test_demo_logout_removes_the_session_cookie():
    demo_client = authenticated_client()

    response = demo_client.delete("/demo/session")

    assert response.status_code == 204
    assert demo_client.get("/demo/session").status_code == 401


def test_analysis_run_is_persisted_in_workspace_quota():
    demo_client = authenticated_client()

    response = demo_client.post(
        "/emissions/calculate",
        json={
            "weight_value": 1,
            "distance_value": 100,
            "transport_method": "truck",
        },
    )

    assert response.status_code == 200
    session = demo_client.get("/demo/session")
    assert session.status_code == 200
    assert session.json()["quotas"]["analysis_runs_per_day"] == {"used": 1, "limit": 10}


def test_analysis_quota_rejects_the_eleventh_run():
    demo_client = authenticated_client()
    payload = {
        "weight_value": 1,
        "distance_value": 100,
        "transport_method": "truck",
    }

    for _ in range(10):
        assert demo_client.post("/emissions/calculate", json=payload).status_code == 200

    response = demo_client.post("/emissions/calculate", json=payload)

    assert response.status_code == 429
    assert response.json()["detail"] == (
        "The daily analysis quota for this workspace has been reached."
    )


def test_shipment_upload_returns_valid_rows_errors_and_analysis():
    demo_client = authenticated_client()
    csv_content = (
        "shipment_id,origin,destination,weight_value,weight_unit,distance_value,"
        "distance_unit,transport_method\n"
        "S-001,Edmonton,Calgary,1,mt,100,km,truck\n"
        "S-002,,Vancouver,-2,kg,not-a-distance,km,submarine\n"
    )

    response = demo_client.post(
        "/shipments/upload",
        files={"file": ("shipments.csv", csv_content.encode(), "text/csv")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["accepted_rows"] == 1
    assert payload["rows"][0]["shipment_id"] == "S-001"
    assert payload["analysis"]["total_emissions_kg"] == 6.2
    assert payload["errors"][0]["row_number"] == 3
    assert payload["warnings"]


def test_shipment_records_are_workspace_isolated():
    first_client = authenticated_client()
    second_client = authenticated_client()
    csv_content = (
        "shipment_id,origin,destination,weight_value,weight_unit,distance_value,"
        "distance_unit,transport_method\n"
        "S-001,Edmonton,Calgary,1,mt,100,km,truck\n"
    )

    upload = first_client.post(
        "/shipments/upload",
        files={"file": ("shipments.csv", csv_content, "text/csv")},
    )

    assert upload.status_code == 200
    assert first_client.get("/shipments").json()["accepted_rows"] == 1
    assert second_client.get("/shipments").json()["accepted_rows"] == 0


def test_shipment_upload_requires_a_workspace_session():
    response = TestClient(app).post(
        "/shipments/upload",
        files={"file": ("shipments.csv", b"shipment_id\nS-001\n", "text/csv")},
    )

    assert response.status_code == 401


def test_evidence_upload_and_search_return_recoverable_citation():
    demo_client = authenticated_client()
    evidence = b"Supplier ABC holds ISO 14001 certification and operates rail routes."

    upload = demo_client.post(
        "/evidence/upload",
        data={
            "supplier_name": "Supplier ABC",
            "supplier_region": "Canada",
            "certifications": "ISO 14001",
            "transport_modes": "rail, truck",
        },
        files={"file": ("supplier.txt", evidence, "text/plain")},
    )

    assert upload.status_code == 200
    assert upload.json()["supplier"]["missing_fields"] == []
    assert upload.json()["chunk_count"] == 1

    search = demo_client.get("/evidence/search", params={"query": "ISO 14001"})

    assert search.status_code == 200
    match = search.json()["matches"][0]
    assert match["supplier_name"] == "Supplier ABC"
    assert match["citation"]["filename"] == "supplier.txt"
    assert match["citation"]["chunk_index"] == 0
    assert "ISO 14001" in match["excerpt"]


def test_evidence_documents_are_workspace_isolated_and_quota_limited():
    first_client = authenticated_client()
    second_client = authenticated_client()
    evidence = b"Supplier ABC holds ISO 14001 certification."

    for index in range(3):
        response = first_client.post(
            "/evidence/upload",
            data={"supplier_name": f"Supplier {index}"},
            files={"file": (f"supplier-{index}.txt", evidence + str(index).encode(), "text/plain")},
        )
        assert response.status_code == 200

    exceeded = first_client.post(
        "/evidence/upload",
        data={"supplier_name": "Supplier 4"},
        files={"file": ("supplier-4.txt", evidence, "text/plain")},
    )

    assert exceeded.status_code == 429
    assert first_client.get("/suppliers").json()["suppliers"]
    assert second_client.get("/suppliers").json()["suppliers"] == []


def test_evidence_upload_requires_a_workspace_session():
    response = TestClient(app).post(
        "/evidence/upload",
        data={"supplier_name": "Supplier ABC"},
        files={"file": ("supplier.txt", b"ISO 14001", "text/plain")},
    )

    assert response.status_code == 401


def _upload_demo_shipments(demo_client: TestClient) -> None:
    csv_content = (
        "shipment_id,origin,destination,weight_value,weight_unit,distance_value,"
        "distance_unit,transport_method\n"
        "S-001,Edmonton,Calgary,1,mt,100,km,truck\n"
    )
    response = demo_client.post(
        "/shipments/upload",
        files={"file": ("shipments.csv", csv_content, "text/csv")},
    )
    assert response.status_code == 200


def test_scenario_comparison_reconciles_with_the_stored_shipment_analysis():
    demo_client = authenticated_client()
    _upload_demo_shipments(demo_client)

    response = demo_client.post(
        "/scenarios/compare",
        json={"alternative_transport_method": "train"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["baseline_total_kg"] == 6.2
    assert payload["alternative_total_kg"] == 2.2
    assert payload["delta_kg"] == -4.0
    assert payload["shipment_results"][0]["delta_kg"] == -4.0


def test_report_preview_and_csv_export_share_current_workspace_state():
    demo_client = authenticated_client()
    _upload_demo_shipments(demo_client)

    preview = demo_client.get("/reports/preview", params={"alternative_mode": "train"})
    export = demo_client.get("/reports/export.csv", params={"alternative_mode": "train"})

    assert preview.status_code == 200
    assert preview.json()["shipment_analysis"]["total_emissions_kg"] == 6.2
    assert preview.json()["scenario"]["alternative_total_kg"] == 2.2
    assert export.status_code == 200
    assert export.headers["content-type"].startswith("text/csv")
    assert "shipment_analysis,total_emissions_kg,6.2" in export.text
    assert "scenario,alternative_total_kg,2.2" in export.text


def test_scenario_and_report_routes_require_a_workspace_session():
    response = TestClient(app).post(
        "/scenarios/compare",
        json={"alternative_transport_method": "train"},
    )
    report = TestClient(app).get("/reports/preview")

    assert response.status_code == 401
    assert report.status_code == 401
