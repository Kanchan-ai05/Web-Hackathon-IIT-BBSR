"""Unit tests for the upgraded multi-alternative Disruption Rescheduling Engine.
"""

import json
import pytest
from backend.rescheduler import CITRescheduler
from backend.solver import generate_weekly_timetable
from backend.validator import validate_schedule

@pytest.fixture
def base_data():
    with open("data/cit_public.json", "r", encoding="utf-8") as f:
        return json.load(f)

def test_five_disruption_types_parsing(base_data):
    """Verifies that apply_disruption_spec correctly parses all 5 disruption types."""
    rescheduler = CITRescheduler(base_data, [])
    spec = {
        "disruption_id": "TEST-5-TYPES",
        "faculty_leaves": [{"faculty_id": "F01", "day": "WED", "periods": [1, 2, 3]}],
        "room_closures": [{"room_id": "CR-101", "day": "THU", "periods": [4, 5]}],
        "new_sessions": [{
            "id": "NEW-SESS-99",
            "course_id": "CS101",
            "kind": "lecture",
            "groups": ["Y1-A"],
            "faculty_id": "F02",
            "size": 50,
            "duration": 1,
            "room_types": ["classroom"],
            "needs_accessible": False
        }],
        "event_timing_changes": [{
            "event_id": "EV-01",
            "room_id": "AUD",
            "new_day": "FRI",
            "new_periods": [10, 11]
        }],
        "emergency_venue_requirements": [{
            "room_id": "LH-1",
            "day": "MON",
            "periods": [2, 3],
            "title": "Dean Emergency Address"
        }]
    }

    updated_dataset, metadata = rescheduler.apply_disruption_spec(spec)
    assert len(metadata["leaves"]) == 1
    assert len(metadata["closures"]) == 1
    assert "NEW-SESS-99" in metadata["new_session_ids"]
    assert len(metadata["event_changes"]) == 1
    assert len(metadata["emergency_venues"]) == 1

def test_infeasibility_diagnostics(base_data):
    """When impossible constraints are imposed, rescheduler returns clear constraint explanations."""
    rescheduler = CITRescheduler(base_data, [])
    # Imposing extreme leave on key faculty
    spec = {
        "disruption_id": "IMPOSSIBLE",
        "faculty_leaves": [
            {"faculty_id": "F01", "day": "MON", "periods": list(range(1, 10))},
            {"faculty_id": "F01", "day": "TUE", "periods": list(range(1, 10))},
            {"faculty_id": "F01", "day": "WED", "periods": list(range(1, 10))},
            {"faculty_id": "F01", "day": "THU", "periods": list(range(1, 10))},
            {"faculty_id": "F01", "day": "FRI", "periods": list(range(1, 10))}
        ]
    }
    reasons = rescheduler._diagnose_infeasibility(spec, base_data)
    assert len(reasons) > 0
    assert any("F01" in r or "faculty" in r.lower() for r in reasons)
