"""Unit tests for Campus Intelligence Analytics Service and Endpoints.
"""

import json
import pytest
from backend.analytics_service import CITAnalyticsService
from backend.app.auth import create_access_token

@pytest.fixture
def base_data():
    with open("data/cit_public.json", "r", encoding="utf-8") as f:
        return json.load(f)

def test_room_utilisation_analytics(base_data):
    slots = [
        {"session_id": "MA101-AB-L1", "day": "MON", "start_period": 1, "room_id": "LH-1"},
        {"session_id": "MA101-AB-L2", "day": "MON", "start_period": 2, "room_id": "LH-1"}
    ]
    service = CITAnalyticsService(base_data, slots, bookings=[])
    res = service.get_room_utilisation()

    assert res["total_room_count"] == len(base_data["rooms"])
    assert res["total_slots_consumed"] == 2
    assert res["average_utilization_pct"] >= 0
    assert len(res["rooms"]) == len(base_data["rooms"])

def test_faculty_workload_analytics(base_data):
    # Both MA101-AB-L1 and MA101-AB-L2 are assigned to faculty F19 (duration 1 each)
    slots = [
        {"session_id": "MA101-AB-L1", "day": "MON", "start_period": 1, "room_id": "LH-1"},
        {"session_id": "MA101-AB-L2", "day": "MON", "start_period": 2, "room_id": "LH-1"}
    ]
    service = CITAnalyticsService(base_data, slots, bookings=[])
    res = service.get_faculty_workload()

    assert res["total_teaching_hours"] == 2
    assert len(res["faculty_workload_ranking"]) == len(base_data["faculty"])
    # F19 should have 2 hours
    f19 = next((f for f in res["faculty_workload_ranking"] if f["faculty_id"] == "F19"), None)
    assert f19 is not None
    assert f19["weekly_hours"] == 2

def test_booking_analytics(base_data):
    test_bookings = [
        {
            "id": "B1",
            "department": "CSE",
            "status": "approved",
            "requested_room": "AUD",
            "assigned_room": "AUD",
            "windows": [{"day": "FRI", "periods": [10, 11]}]
        },
        {
            "id": "B2",
            "department": "ME",
            "status": "pending",
            "requested_room": "AUD",
            "windows": [{"day": "FRI", "periods": [10, 11]}]
        }
    ]
    service = CITAnalyticsService(base_data, [], bookings=test_bookings)
    res = service.get_booking_analytics()

    assert res["total_bookings"] == 2
    assert res["status_breakdown"]["approved"] == 1
    assert res["status_breakdown"]["pending"] == 1
    assert any(v["room_id"] == "AUD" for v in res["top_requested_venues"])

def test_csv_export_generation(base_data):
    service = CITAnalyticsService(base_data, [], bookings=[])
    rooms_csv = service.generate_csv_report("rooms")
    assert "Room ID" in rooms_csv
    assert "Utilization %" in rooms_csv

    faculty_csv = service.generate_csv_report("faculty")
    assert "Faculty ID" in faculty_csv
    assert "Weekly Hours" in faculty_csv

    bookings_csv = service.generate_csv_report("bookings")
    assert "Booking ID" in bookings_csv

def test_analytics_api_endpoints_live(client):
    token = create_access_token({"sub": "admin@cit.edu", "role": "admin", "name": "Dean"})
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/analytics/overview", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "summary_kpis" in data
    assert "room_utilisation" in data
    assert "faculty_workload" in data
    assert "booking_analytics" in data

    # Test CSV export
    res_csv = client.get("/api/analytics/export/csv?report_type=rooms", headers=headers)
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]
