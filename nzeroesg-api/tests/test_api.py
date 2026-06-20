from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health_is_available_without_provider_credentials():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "environment": "development",
        "assistant_enabled": False,
    }


def test_disabled_assistant_has_an_explicit_response():
    response = client.post("/chat", json={"message": "Compare rail and air."})

    assert response.status_code == 503
    assert response.json()["detail"] == "The optional assistant is disabled in this environment."


def test_chat_request_is_validated_before_provider_work():
    response = client.post("/chat", json={"message": ""})

    assert response.status_code == 422
