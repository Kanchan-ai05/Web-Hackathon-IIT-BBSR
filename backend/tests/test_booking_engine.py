import json
import pytest
from backend.booking_engine import CITBookingEngine
from backend.app.auth import create_access_token

@pytest.fixture
def cit_data():
    with open("data/cit_public.json", "r", encoding="utf-8") as f:
        return json.load(f)

def test_booking_engine_priority_and_alternatives(cit_data):
    engine = CITBookingEngine(cit_data, timetable_slots=[])

    # 1. High priority institute event BR-01 (Auditorium on Monday P4-P5)
    br01 = [b for b in cit_data["booking_requests"] if b["id"] == "BR-01"][0]
    res1 = engine.process_request(br01)
    assert res1["decision"] == "approve"
    assert res1["assigned_slot"]["room_id"] == "AUD"
    assert res1["assigned_slot"]["day"] == "MON"

    # 2. Conflicting club event wanting AUD on Monday P4-P5
    conflicting_req = {
        "id": "BR-CONFLICT",
        "requester": "Some Club",
        "role": "club",
        "requested_category": "club_event",
        "attendance": 400,
        "duration_periods": 2,
        "windows": [{"day": "MON", "from_period": 4, "to_period": 5}],
        "room_types": ["auditorium"],
        "needs": ["stage"],
        "requested_room": "AUD",
        "mandatory_for_groups": []
    }
    res2 = engine.process_request(conflicting_req)
    # AUD is already occupied by BR-01 -> must reject or provide alternative
    assert res2["decision"] in ("reject", "alternative")
    assert "occupied" in res2["reason"].lower() or "unavailable" in res2["reason"].lower()

def test_booking_role_cap_demotion(cit_data):
    engine = CITBookingEngine(cit_data, timetable_slots=[])

    # Club requesting institute_event (should be capped to club_event)
    club_req = {
        "id": "BR-ABUSE",
        "requester": "Music Club",
        "role": "club",
        "requested_category": "institute_event",  # Role abuse
        "attendance": 100,
        "duration_periods": 2,
        "windows": [{"day": "TUE", "from_period": 10, "to_period": 11}],
        "room_types": ["seminar_hall"],
        "needs": [],
        "requested_room": "SH-1",
        "mandatory_for_groups": []
    }
    res = engine.process_request(club_req)
    assert res["decision"] == "approve"
    assert "role cap" in res["reason"].lower() or "club_event" in res["reason"]

def test_self_approval_prohibited(cit_data):
    engine = CITBookingEngine(cit_data, timetable_slots=[])
    br01 = [b for b in cit_data["booking_requests"] if b["id"] == "BR-01"][0]

    # Approver is the requester
    res = engine.process_request(br01, approver_user={"name": "Spectra Core Team", "email": "spectra@cit.edu"})
    assert res["decision"] == "reject"
    assert "self-approval" in res["reason"].lower()

def test_batch_process_endpoint(client):
    admin_token = create_access_token({"sub": "admin@cit.edu", "role": "admin", "name": "Dean"})
    headers = {"Authorization": f"Bearer {admin_token}"}

    response = client.post("/api/bookings/batch-process", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "Processed" in data["message"]
    assert len(data["decisions"]) == 25
    decisions = [d["decision"] for d in data["decisions"]]
    assert "approve" in decisions
    assert "cancelled" in decisions  # BR-04 was cancelled
