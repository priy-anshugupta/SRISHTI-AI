import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_load_sample_document_wcr():
    response = client.post("/api/documents/load-sample?sample_name=wcr_moran_7")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["filename"] == "Sample_WCR_Moran_7.pdf"
    assert data["well_id"] == "MORAN-7"
    assert data["formation"] == "Tipam Sandstone"
    assert data["event_type"] == "Lost Circulation"
    assert data["ocr_confidence"] == 98.4

def test_load_sample_document_ddr():
    response = client.post("/api/documents/load-sample?sample_name=ddr_moran_29")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["filename"] == "Sample_DDR_Moran_29.pdf"
    assert data["well_id"] == "MORAN-29"
    assert data["formation"] == "Barail Group"
    assert data["event_type"] == "Gas Kick / Influx"

def test_ask_drilling_intelligence_edge_mode():
    payload = {
        "question": "What are the mud weight recommendations for Barail formation in Moran area?",
        "target_well": "MORAN-29",
        "current_depth_md": 2418.0,
        "language": "EN",
        "mode": "edge"
    }
    response = client.post("/api/ask", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert len(data["answer"]) > 0
    assert "evidence" in data
    assert data["mode"] == "edge"
    assert "Sovereign Rig Edge" in data["model"]

def test_ask_drilling_intelligence_cloud_mode():
    payload = {
        "question": "What is the recommended casing seat depth for Moran field?",
        "target_well": "MORAN-7",
        "current_depth_md": 1840.0,
        "language": "EN",
        "mode": "cloud"
    }
    response = client.post("/api/ask", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert len(data["answer"]) > 0
    assert data["mode"] == "cloud"
