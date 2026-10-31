import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def get_auth_token(email="admin@cit.edu", password="Admin@123"):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    return res.json()["access_token"]

def test_ai_test_key_blank():
    token = get_auth_token()
    res = client.post(
        "/api/ai/test-key",
        headers={"Authorization": f"Bearer {token}"},
        json={"api_key": "", "provider": "gemini"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is False

def test_ai_test_key_fake_key_handled_gracefully():
    token = get_auth_token()
    res = client.post(
        "/api/ai/test-key",
        headers={"Authorization": f"Bearer {token}"},
        json={"api_key": "AIzaSyFakeKeyTesting123456", "provider": "gemini"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is False
    assert "Failed to connect" in data["message"]

def test_ai_parse_booking_endpoint():
    token = get_auth_token(email="club@cit.edu", password="Club@123")
    res = client.post(
        "/api/ai/parse-booking",
        headers={
            "Authorization": f"Bearer {token}",
            "X-Gemini-Key": "test_fake_key_so_it_falls_back"
        },
        json={"text": "Spectra fest ke liye Audi chahiye Thursday 6 to 9 pm 200 people with stage"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ready"
    assert data["parsed_booking"]["day"] == "THU"
    assert data["parsed_booking"]["requested_room"] == "AUD"
    assert data["parsed_booking"]["event_type"] == "club_event"

def test_ai_ask_timetable_endpoint():
    token = get_auth_token()
    res = client.post(
        "/api/ai/ask-timetable",
        headers={"Authorization": f"Bearer {token}"},
        json={"query": "What are the lunch hours?"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "13:00 to 14:00" in data["answer"]
