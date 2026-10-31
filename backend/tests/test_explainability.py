"""Unit & Integration Tests for Explainable Scheduling Assistant.

Validates that:
1. Explanations compute all 5 required pillars (room selection, time selection,
   rejected rooms, 13 hard constraints, soft constraints impact).
2. Head-to-head room comparison correctly identifies rejection causes.
3. Booking and exam explanations accurately report priority and halved capacity rules.
4. API endpoints return 200 OK with deterministic provenance.
"""

import json
import os
import pytest
from fastapi.testclient import TestClient

from backend.explainability_service import CITExplainabilityService
from backend.app.main import app
from backend.app.auth import create_access_token

def _load_test_dataset():
    data_path = "data/cit_public.json"
    if not os.path.exists(data_path):
        data_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "cit_public.json")
    with open(data_path, "r", encoding="utf-8") as f:
        return json.load(f)

def _load_test_schedule():
    sched_path = "exports/schedule.json"
    if not os.path.exists(sched_path):
        sched_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "exports", "schedule.json")
    with open(sched_path, "r", encoding="utf-8") as f:
        return json.load(f)

def test_explain_session_5_pillars():
    dataset = _load_test_dataset()
    sched = _load_test_schedule()
    service = CITExplainabilityService(dataset, sched["timetable"], sched.get("bookings", []), sched.get("exams", []))

    # Test lecture session MA101-AB-L1
    sess_id = "MA101-AB-L1"
    res = service.explain_session(sess_id)

    assert "error" not in res
    assert res["session_id"] == sess_id

    # 1. Why room selected
    assert "why_room_selected" in res
    assert len(res["why_room_selected"]) >= 4
    categories = [r["category"] for r in res["why_room_selected"]]
    assert "Type Matching" in categories
    assert "Capacity Sizing" in categories
    assert "Venue Availability" in categories

    # 2. Why time selected
    assert "why_time_selected" in res
    assert len(res["why_time_selected"]) >= 4
    time_cats = [t["category"] for t in res["why_time_selected"]]
    assert "Faculty Availability" in time_cats
    assert "Student Cohorts Schedule" in time_cats
    assert "Lunch Break Protection" in time_cats

    # 3. Why another room was rejected
    assert "rejected_rooms" in res
    assert res["total_rejected_rooms"] == 26  # 27 rooms total - 1 assigned = 26 rejected
    assert len(res["rejected_rooms"]) == 26

    # Verify every rejected room has concrete reasons
    for rej in res["rejected_rooms"]:
        assert rej["room_id"] != res["assignment"]["room_id"]
        assert len(rej["reasons"]) > 0
        assert rej["primary_reason_category"] in [
            "CAPACITY_TOO_SMALL", "ROOM_TYPE_MISMATCH", "INACCESSIBLE",
            "OCCUPIED_BY_SESSION", "OCCUPIED_BY_BOOKING", "ROOM_MAINTENANCE",
            "SUBOPTIMAL_UTILIZATION"
        ]

    # 4. Hard constraints checked (13 rules)
    assert "hard_constraints_checked" in res
    assert len(res["hard_constraints_checked"]) == 13
    rule_ids = [h["rule_id"] for h in res["hard_constraints_checked"]]
    assert "RULE_ROOM_CAPACITY" in rule_ids
    assert "RULE_ROOM_TYPE" in rule_ids
    assert "RULE_ROOM_CLASH" in rule_ids
    assert "RULE_FACULTY_CLASH" in rule_ids
    assert "RULE_GROUP_CLASH" in rule_ids
    assert "RULE_FACULTY_UNAVAILABLE" in rule_ids
    assert "RULE_ROOM_UNAVAILABLE" in rule_ids
    assert "RULE_LUNCH_CROSSOVER" in rule_ids
    assert "RULE_FACULTY_DAILY_LIMIT" in rule_ids

    for h in res["hard_constraints_checked"]:
        assert h["status"] in ["PASS", "NOT_APPLICABLE"]
        assert len(h["proof"]) > 0

    # 5. Soft constraints impact
    assert "soft_constraints_impact" in res
    assert len(res["soft_constraints_impact"]) >= 4
    soft_objs = [s["objective"] for s in res["soft_constraints_impact"]]
    assert any("Period 9" in o for o in soft_objs)
    assert any("Faculty" in o for o in soft_objs)
    assert any("Room Sizing" in o for o in soft_objs)

    # Provenance
    assert res["provenance"]["llm_verified"] is False
    assert res["provenance"]["zero_hallucination_guarantee"] is True

def test_explain_lab_session():
    dataset = _load_test_dataset()
    sched = _load_test_schedule()
    service = CITExplainabilityService(dataset, sched["timetable"], sched.get("bookings", []), sched.get("exams", []))

    # Find a lab session
    lab_sess = next((s for s in dataset.get("sessions", []) if s.get("kind") == "lab"), None)
    assert lab_sess is not None

    res = service.explain_session(lab_sess["id"])
    assert res["kind"] == "lab"
    assert res["duration"] in [2, 3]

    # Verify lab block policy is documented
    time_cats = [t["category"] for t in res["why_time_selected"]]
    assert "Lab Block Policy" in time_cats

def test_compare_rooms_head_to_head():
    dataset = _load_test_dataset()
    sched = _load_test_schedule()
    service = CITExplainabilityService(dataset, sched["timetable"], sched.get("bookings", []), sched.get("exams", []))

    sess_id = "MA101-AB-L1"
    assigned_slot = next(s for s in sched["timetable"] if s["session_id"] == sess_id)
    assigned_r = assigned_slot["room_id"]

    # Pick another room (e.g. CR-105 or a small room)
    other_r = "CR-105" if assigned_r != "CR-105" else "CR-101"
    comp = service.compare_rooms(sess_id, other_r)

    assert comp["session_id"] == sess_id
    assert comp["assigned_room"]["id"] == assigned_r
    assert comp["assigned_room"]["status"] == "SELECTED"
    assert comp["candidate_room"]["id"] == other_r
    assert len(comp["comparative_verdict"]) > 0

def test_explain_booking_decision():
    dataset = _load_test_dataset()
    sched = _load_test_schedule()
    service = CITExplainabilityService(dataset, sched["timetable"], sched.get("bookings", []), sched.get("exams", []))

    res = service.explain_booking("BR-01")
    assert res["booking_id"] == "BR-01"
    assert "status" in res
    assert "priority_rank" in res
    assert len(res["reasons"]) > 0
    assert res["provenance"]["llm_verified"] is False

def test_explain_exam_decision():
    dataset = _load_test_dataset()
    sched = _load_test_schedule()
    service = CITExplainabilityService(dataset, sched["timetable"], sched.get("bookings", []), sched.get("exams", []))

    res = service.explain_exam("EX-MA101")
    assert res["exam_id"] == "EX-MA101"
    assert "total_effective_capacity" in res
    assert len(res["room_breakdown"]) > 0
    # Anti-cheating halved capacity check
    for r in res["room_breakdown"]:
        assert r["halved_capacity"] == r["full_capacity"] // 2
    assert len(res["reasons"]) > 0

def test_explain_api_endpoints_live():
    client = TestClient(app)

    # 1. GET /api/explain/sessions
    r_sessions = client.get("/api/explain/sessions")
    assert r_sessions.status_code == 200
    data = r_sessions.json()
    assert data["count"] > 0
    first_sess = data["sessions"][0]["session_id"]

    # 2. GET /api/explain/session/{session_id}
    r_expl = client.get(f"/api/explain/session/{first_sess}")
    assert r_expl.status_code == 200
    expl_data = r_expl.json()
    assert expl_data["session_id"] == first_sess
    assert len(expl_data["why_room_selected"]) > 0
    assert len(expl_data["why_time_selected"]) > 0
    assert len(expl_data["rejected_rooms"]) > 0

    # 3. GET /api/explain/compare-room/{session_id}/{candidate_room_id}
    cand_r = expl_data["rejected_rooms"][0]["room_id"]
    r_comp = client.get(f"/api/explain/compare-room/{first_sess}/{cand_r}")
    assert r_comp.status_code == 200
    comp_data = r_comp.json()
    assert comp_data["candidate_room"]["id"] == cand_r

    # 4. POST /api/explain/ai-narrative (offline rules template)
    r_ai = client.post("/api/explain/ai-narrative", json={
        "session_id": first_sess,
        "explanation": expl_data
    })
    assert r_ai.status_code == 200
    ai_data = r_ai.json()
    assert len(ai_data["narrative"]) > 0
    assert "pure Python" in ai_data["disclaimer"] or "deterministic" in ai_data["disclaimer"]
