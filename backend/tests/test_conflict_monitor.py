"""Unit tests for the Intelligent Conflict Monitoring & Predictive Risk Assessment Engine.
"""

import json
import pytest
from backend.conflict_monitor import CITConflictMonitor
from backend.app.auth import create_access_token

@pytest.fixture
def base_data():
    with open("data/cit_public.json", "r", encoding="utf-8") as f:
        return json.load(f)

def test_conflict_monitor_clean_baseline(base_data):
    """Clean schedule with valid distinct sessions should have zero hard conflicts."""
    slots = [
        {"session_id": "MA101-AB-L1", "day": "MON", "start_period": 1, "room_id": "LH-1"}
    ]
    monitor = CITConflictMonitor(base_data, slots, bookings=[])
    conflicts = monitor.detect_all_conflicts()
    assert len(conflicts) == 0

def test_detect_room_overlap(base_data):
    """Two events in the same room at the same time must be flagged as Critical ROOM_OVERLAP."""
    slots = [
        {"session_id": "MA101-AB-L1", "day": "MON", "start_period": 1, "room_id": "LH-1"},
        {"session_id": "CS101-A-L1", "day": "MON", "start_period": 1, "room_id": "LH-1"}
    ]
    monitor = CITConflictMonitor(base_data, slots, bookings=[])
    conflicts = monitor.detect_all_conflicts()
    assert len(conflicts) >= 1
    assert any(c["type"] == "ROOM_OVERLAP" and c["severity"] == "Critical" for c in conflicts)
    assert any("LH-1" in c["entities"] for c in conflicts)

def test_detect_faculty_overlap(base_data):
    """Faculty scheduled for two sessions simultaneously must be flagged as FACULTY_OVERLAP."""
    # Both MA101-AB-L1 and MA101-AB-L2 belong to faculty F19
    slots = [
        {"session_id": "MA101-AB-L1", "day": "MON", "start_period": 1, "room_id": "LH-1"},
        {"session_id": "MA101-AB-L2", "day": "MON", "start_period": 1, "room_id": "LH-2"}
    ]
    monitor = CITConflictMonitor(base_data, slots, bookings=[])
    conflicts = monitor.detect_all_conflicts()
    assert any(c["type"] == "FACULTY_OVERLAP" and c["severity"] == "Critical" for c in conflicts)

def test_detect_room_capacity_violation(base_data):
    """Session exceeding room capacity must be flagged as ROOM_CAPACITY violation."""
    # MA101-AB-L1 has size 180, LAB-CS1 capacity is 40
    slots = [
        {"session_id": "MA101-AB-L1", "day": "TUE", "start_period": 2, "room_id": "LAB-CS1"}
    ]
    monitor = CITConflictMonitor(base_data, slots, bookings=[])
    conflicts = monitor.detect_all_conflicts()
    assert any(c["type"] in ["ROOM_CAPACITY", "ROOM_TYPE_MISMATCH"] for c in conflicts)

def test_detect_room_maintenance_conflict(base_data):
    """Session or booking during declared room maintenance must be flagged."""
    ru = base_data.get("room_unavailability", [{}])[0]
    if ru:
        slots = [
            {"session_id": "MA101-AB-L1", "day": ru["day"], "start_period": ru["periods"][0], "room_id": ru["room_id"]}
        ]
        monitor = CITConflictMonitor(base_data, slots, bookings=[])
        conflicts = monitor.detect_all_conflicts()
        assert any(c["type"] == "ROOM_MAINTENANCE_CONFLICT" for c in conflicts)

def test_room_risk_scores_and_classification(base_data):
    """Calculates risk scores, verifies bounds [0, 100], and classification levels."""
    slots = [
        {"session_id": "MA101-AB-L1", "day": "MON", "start_period": 1, "room_id": "LH-1"},
        {"session_id": "CS101-A-L1", "day": "MON", "start_period": 2, "room_id": "LH-1"}
    ]
    monitor = CITConflictMonitor(base_data, slots, bookings=base_data.get("booking_requests", []))
    room_risks = monitor.calculate_room_risk_scores()

    assert len(room_risks) == len(base_data["rooms"])
    for r in room_risks:
        assert 0 <= r["risk_score"] <= 100
        assert r["risk_level"] in ["Low", "Medium", "High", "Critical"]
        assert r["demand_level"] in ["Low Demand", "Moderate Demand", "High Demand"]

def test_predictive_booking_risks(base_data):
    """Assesses booking contention and detects potential future overbooking."""
    slots = [
        {"session_id": "MA101-AB-L1", "day": "WED", "start_period": 10, "room_id": "AUD"}
    ]
    test_booking = [{
        "id": "REQ-TEST-01",
        "title": "Hackathon Opening",
        "requester": "club@cit.edu",
        "role": "club",
        "requested_category": "club_event",
        "attendance": 200,
        "duration_periods": 2,
        "windows": [{"day": "WED", "periods": [10, 11]}],
        "requested_room": "AUD",
        "status": "pending"
    }]
    monitor = CITConflictMonitor(base_data, slots, bookings=test_booking)
    b_risks = monitor.detect_predictive_booking_risks()

    assert len(b_risks) == 1
    assert b_risks[0]["has_collision"] is True
    assert b_risks[0]["risk_level"] in ["High", "Critical"]
    assert b_risks[0]["risk_score"] >= 50

def test_conflict_endpoints_live(client):
    """Verifies FastAPI conflict monitoring endpoints with auth token."""
    token = create_access_token({"sub": "admin@cit.edu", "role": "admin", "name": "Dean"})
    headers = {"Authorization": f"Bearer {token}"}

    # Summary
    res = client.get("/api/conflicts/summary", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_active_conflicts" in data
    assert "average_room_risk_score" in data
    assert "severity_breakdown" in data

    # Room risks
    res = client.get("/api/conflicts/room-risks", headers=headers)
    assert res.status_code == 200
    assert "rooms" in res.json()

    # Booking risks
    res = client.get("/api/conflicts/booking-risks", headers=headers)
    assert res.status_code == 200
    assert "bookings" in res.json()
