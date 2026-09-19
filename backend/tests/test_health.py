from fastapi.testclient import TestClient

from backend.main import app


def test_health_reports_unconfigured_dependencies_without_lying() -> None:
    response = TestClient(app).get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] in {"ready", "configuration_required"}
    assert "supabase" in payload["dependencies"]
