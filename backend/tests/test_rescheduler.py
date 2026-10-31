import os
import json
import pytest
from backend.solver import generate_weekly_timetable
from backend.rescheduler import CITRescheduler
from backend.validator import validate_schedule
from backend.app.auth import create_access_token

def test_sample_disruption_minimal_moves():
    with open("data/cit_public.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    with open("data/sample_disruption.json", "r", encoding="utf-8") as f:
        disruption_spec = json.load(f)

    # Initial clash-free timetable
    initial_timetable = generate_weekly_timetable(data, timeout_seconds=30.0)
    assert initial_timetable is not None

    rescheduler = CITRescheduler(data, initial_timetable)
    result = rescheduler.reschedule(disruption_spec, timeout_seconds=40.0)

    assert result["status"] == "pending_approval"
    assert result["moved_count"] <= 5, f"Expected minimal moves (<=5), got {result['moved_count']}"
    assert result["new_sessions_count"] == 1
    assert len(result["diff"]) > 0

    # Validate rescheduled timetable with updated dataset
    val = validate_schedule(result["updated_dataset"], timetable_slots=result["new_timetable"])
    assert val["valid"] is True, f"Hard violations after disruption: {val['violations']}"
    assert val["hard_violations_count"] == 0

def test_disruption_endpoint_exports_schedule_after(client):
    admin_token = create_access_token({"sub": "admin@cit.edu", "role": "admin", "name": "Dean"})
    headers = {"Authorization": f"Bearer {admin_token}"}

    response = client.post("/api/timetable/disrupt", json=None, headers=headers)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "pending_approval"

    export_path = os.path.join(os.getcwd(), "exports", "schedule_after.json")
    assert os.path.exists(export_path), "exports/schedule_after.json must be generated"

    with open(export_path, "r", encoding="utf-8") as f:
        exported = json.load(f)
    assert "diff" in exported
    assert "timetable" in exported
    assert exported["moved_count"] <= 5
