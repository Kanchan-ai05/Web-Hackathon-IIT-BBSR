import os
import json
import pytest
from backend.solver import generate_weekly_timetable
from backend.exam_scheduler import schedule_midsem_exams
from backend.validator import validate_schedule
from backend.app.auth import create_access_token

def test_full_timetable_and_exam_solve():
    with open("data/cit_public.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    # 1. Solve weekly timetable
    timetable = generate_weekly_timetable(data, timeout_seconds=40.0)
    assert timetable is not None, "Solver must find a clash-free timetable"
    assert len(timetable) == 189, "All 189 sessions must be placed"

    # 2. Solve midsem exams
    exams = schedule_midsem_exams(data, timeout_seconds=30.0)
    assert exams is not None, "Exam scheduler must place all exams"
    assert len(exams) == 41, "All 41 midsem exams must be placed"

    # 3. Validate complete schedule with official validator
    validation = validate_schedule(
        dataset=data,
        timetable_slots=timetable,
        exam_allocations=exams
    )
    assert validation["valid"] is True, f"Hard violations found: {validation['violations']}"
    assert validation["hard_violations_count"] == 0
    assert validation["soft_penalty"] >= 0

def test_generate_endpoint_exports_schedule(client):
    admin_token = create_access_token({"sub": "admin@cit.edu", "role": "admin", "name": "Dean"})
    headers = {"Authorization": f"Bearer {admin_token}"}

    response = client.post("/api/timetable/generate?timeout_seconds=40.0", headers=headers)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["sessions_placed"] == 189
    assert res_data["exams_placed"] == 41

    export_path = os.path.join(os.getcwd(), "exports", "schedule.json")
    assert os.path.exists(export_path), "exports/schedule.json must be generated"

    with open(export_path, "r", encoding="utf-8") as f:
        exported = json.load(f)
    assert len(exported["timetable"]) == 189
    assert len(exported["exams"]) == 41
    assert exported["validation"]["hard_violations_count"] == 0

def test_manual_schedule_blocked_on_hard_clash(client):
    coord_token = create_access_token({"sub": "coordinator@cit.edu", "role": "department_coordinator", "name": "Coord"})
    headers = {"Authorization": f"Bearer {coord_token}"}

    # Attempt to place MA101-AB-L1 (size 180) into CR-101 (capacity 90) -> capacity violation
    bad_request = {
        "session_id": "MA101-AB-L1",
        "day": "MON",
        "start_period": 2,
        "room_id": "CR-101"
    }
    response = client.post("/api/timetable/manual-schedule", json=bad_request, headers=headers)
    assert response.status_code == 400
    err = response.json()
    assert err["detail"]["error"] == "HARD_CONSTRAINT_VIOLATION"
