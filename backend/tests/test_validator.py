import json
import pytest
from backend.validator import (
    CITValidator,
    RULE_FACULTY_CLASH,
    RULE_GROUP_CLASH,
    RULE_ROOM_CLASH,
    RULE_ROOM_CAPACITY,
    RULE_ROOM_TYPE,
    RULE_FACULTY_UNAVAILABLE,
    RULE_ROOM_UNAVAILABLE,
    RULE_LUNCH_CROSSOVER,
    RULE_LAB_SLOT,
    RULE_ACCESSIBLE_ROOM,
    RULE_ELECTIVE_BASKET,
    RULE_FACULTY_DAILY_LIMIT,
    RULE_FIXED_SLOT,
    RULE_BOOKING_OVERLAP,
)

@pytest.fixture
def cit_data():
    with open("data/cit_public.json", "r", encoding="utf-8") as f:
        return json.load(f)

@pytest.fixture
def validator(cit_data):
    return CITValidator(cit_data)

def test_faculty_clash(validator):
    # F01 teaches CS101-A-L1 and CS101-A-L2
    # Schedule both on MON P2 in different rooms
    slots = [
        {"session_id": "CS101-A-L1", "day": "MON", "start_period": 2, "room_id": "CR-101"},
        {"session_id": "CS101-A-L2", "day": "MON", "start_period": 2, "room_id": "CR-102"}
    ]
    result = validator.validate(timetable_slots=slots)
    rules = [v["rule"] for v in result["violations"]]
    assert RULE_FACULTY_CLASH in rules

def test_group_clash(validator):
    # Y1-A is in CS101-A-L1 (faculty F01) and PH101-A-L1 (faculty F21)
    # Schedule both on MON P3
    slots = [
        {"session_id": "CS101-A-L1", "day": "MON", "start_period": 3, "room_id": "CR-101"},
        {"session_id": "PH101-A-L1", "day": "MON", "start_period": 3, "room_id": "CR-102"}
    ]
    result = validator.validate(timetable_slots=slots)
    rules = [v["rule"] for v in result["violations"]]
    assert RULE_GROUP_CLASH in rules

def test_room_clash(validator):
    # Two different sessions in the same room CR-101 on MON P4
    slots = [
        {"session_id": "CS101-A-L1", "day": "MON", "start_period": 4, "room_id": "CR-101"},
        {"session_id": "PH101-C-L1", "day": "MON", "start_period": 4, "room_id": "CR-101"}
    ]
    result = validator.validate(timetable_slots=slots)
    rules = [v["rule"] for v in result["violations"]]
    assert RULE_ROOM_CLASH in rules

def test_room_capacity_regular(validator):
    # MA101-AB-L1 has size 180. CR-101 has capacity 90.
    slots = [
        {"session_id": "MA101-AB-L1", "day": "MON", "start_period": 2, "room_id": "CR-101"}
    ]
    result = validator.validate(timetable_slots=slots)
    rules = [v["rule"] for v in result["violations"]]
    assert RULE_ROOM_CAPACITY in rules

def test_room_capacity_halved_for_exams(validator):
    # EX-CS201 has size 80.
    # LH-3 has capacity 120. During exams, effective capacity is 120/2 = 60 < 80.
    exam_allocs = [
        {
            "exam_id": "EX-CS201",
            "day": "MON",
            "session": "AM",
            "rooms": ["LH-3"]
        }
    ]
    result = validator.validate(exam_allocations=exam_allocs)
    rules = [v["rule"] for v in result["violations"]]
    assert RULE_ROOM_CAPACITY in rules

    # But LH-1 has capacity 200 (effective exam capacity = 100 >= 80) -> Valid!
    valid_exam_allocs = [
        {
            "exam_id": "EX-CS201",
            "day": "MON",
            "session": "AM",
            "rooms": ["LH-1"]
        }
    ]
    res_valid = validator.validate(exam_allocations=valid_exam_allocs)
    assert RULE_ROOM_CAPACITY not in [v["rule"] for v in res_valid["violations"]]

def test_room_type_mismatch(validator):
    # PH191-A-P1 is a physics lab (room_types: ["lab_phy"])
    # Placing it in CS-LAB-1 should trigger RULE_ROOM_TYPE
    slots = [
        {"session_id": "PH191-A-P1", "day": "MON", "start_period": 2, "room_id": "CS-LAB-1"}
    ]
    result = validator.validate(timetable_slots=slots)
    rules = [v["rule"] for v in result["violations"]]
    assert RULE_ROOM_TYPE in rules

def test_faculty_unavailability(validator):
    # F01 is unavailable WED periods 6, 7, 8, 9 (HOD meeting)
    slots = [
        {"session_id": "CS101-A-L1", "day": "WED", "start_period": 6, "room_id": "CR-101"}
    ]
    result = validator.validate(timetable_slots=slots)
    rules = [v["rule"] for v in result["violations"]]
    assert RULE_FACULTY_UNAVAILABLE in rules

def test_room_unavailability(validator):
    # LH-4 is unavailable THU all day (ceiling repair)
    slots = [
        {"session_id": "MA101-AB-L1", "day": "THU", "start_period": 2, "room_id": "LH-4"}
    ]
    result = validator.validate(timetable_slots=slots)
    rules = [v["rule"] for v in result["violations"]]
    assert RULE_ROOM_UNAVAILABLE in rules

def test_lunch_crossover(validator):
    # P5 is 12:00-13:00. P6 is 14:00-15:00.
    # A 3-hour session starting at period 5 crosses lunch (P5, P6, P7)
    # Even a hypothetical 2-hour lecture starting at P5 crosses lunch
    slots = [
        {"session_id": "CS191-A-P1", "day": "MON", "start_period": 5, "room_id": "CS-LAB-1"}
    ]
    result = validator.validate(timetable_slots=slots)
    rules = [v["rule"] for v in result["violations"]]
    assert RULE_LUNCH_CROSSOVER in rules

def test_lab_slot_restriction(validator):
    # CS191-A-P1 is a 3-hour lab. Labs can only be in P2-P4 or P6-P8.
    # Starting at period 1 is invalid.
    slots = [
        {"session_id": "CS191-A-P1", "day": "MON", "start_period": 1, "room_id": "CS-LAB-1"}
    ]
    result = validator.validate(timetable_slots=slots)
    rules = [v["rule"] for v in result["violations"]]
    assert RULE_LAB_SLOT in rules

def test_accessible_room_required(validator):
    # ME201-L1 needs accessible (ME-2 student group has needs_accessible: True).
    # CR-201 has accessible: False (2nd floor, no lift).
    slots = [
        {"session_id": "ME201-L1", "day": "MON", "start_period": 2, "room_id": "CR-201"}
    ]
    result = validator.validate(timetable_slots=slots)
    rules = [v["rule"] for v in result["violations"]]
    assert RULE_ACCESSIBLE_ROOM in rules

def test_elective_basket_sync(validator):
    # OE301-L1 and OE302-L1 both have basket_slot: "OEB-1"
    # They must run at the same day and start_period.
    slots = [
        {"session_id": "OE301-L1", "day": "MON", "start_period": 2, "room_id": "LH-3"},
        {"session_id": "OE302-L1", "day": "TUE", "start_period": 3, "room_id": "LH-4"}
    ]
    result = validator.validate(timetable_slots=slots)
    rules = [v["rule"] for v in result["violations"]]
    assert RULE_ELECTIVE_BASKET in rules

def test_elective_basket_concurrent_no_clash(validator):
    # OE301-L1, OE302-L1, OE303-L1 share student groups (CSE-3, ECE-3, EE-3, ME-3, CE-3)
    # When scheduled at the SAME day and period in DIFFERENT rooms, they MUST NOT cause a group clash!
    slots = [
        {"session_id": "OE301-L1", "day": "MON", "start_period": 2, "room_id": "LH-3"},
        {"session_id": "OE302-L1", "day": "MON", "start_period": 2, "room_id": "LH-5"},
        {"session_id": "OE303-L1", "day": "MON", "start_period": 2, "room_id": "LH-6"}
    ]
    result = validator.validate(timetable_slots=slots)
    group_clashes = [v for v in result["violations"] if v["rule"] == RULE_GROUP_CLASH]
    assert len(group_clashes) == 0, "Elective basket concurrent sessions should not trigger group clash"

def test_faculty_daily_teaching_limit(validator):
    # F02 has CS101-C-L1, CS101-C-L2, CS201-L1, CS201-L2, CS201-L3 (all 1h lectures)
    # Schedule all 5 on MON -> 5 hours > 4 hours daily limit
    slots = [
        {"session_id": "CS101-C-L1", "day": "MON", "start_period": 1, "room_id": "CR-101"},
        {"session_id": "CS101-C-L2", "day": "MON", "start_period": 2, "room_id": "CR-101"},
        {"session_id": "CS201-L1", "day": "MON", "start_period": 3, "room_id": "CR-101"},
        {"session_id": "CS201-L2", "day": "MON", "start_period": 4, "room_id": "CR-101"},
        {"session_id": "CS201-L3", "day": "MON", "start_period": 6, "room_id": "CR-101"}
    ]
    result = validator.validate(timetable_slots=slots)
    rules = [v["rule"] for v in result["violations"]]
    assert RULE_FACULTY_DAILY_LIMIT in rules

def test_booking_overlap(validator):
    # Approved booking BR-01 in AUD on MON P4-P5
    # Class also scheduled in AUD on MON P4
    slots = [
        {"session_id": "ID101-ALL-L1", "day": "MON", "start_period": 4, "room_id": "AUD"}
    ]
    bookings = [
        {
            "booking_id": "BR-01",
            "day": "MON",
            "periods": [4, 5],
            "room_id": "AUD",
            "status": "approved"
        }
    ]
    result = validator.validate(timetable_slots=slots, booking_allocations=bookings)
    rules = [v["rule"] for v in result["violations"]]
    assert RULE_BOOKING_OVERLAP in rules

def test_soft_penalty_computation(validator):
    # F02 prefers to avoid P1 (8 AM)
    # Schedule F02 in period 1 -> soft penalty for avoid preference
    # And group Y1-C scheduled at P1 and P3 -> 1 gap period (P2 is empty)
    # And session in P9 -> P9 late penalty
    slots = [
        {"session_id": "CS101-C-L1", "day": "MON", "start_period": 1, "room_id": "CR-101"},
        {"session_id": "CS101-C-L2", "day": "MON", "start_period": 3, "room_id": "CR-101"},
        {"session_id": "HS101-C-L1", "day": "MON", "start_period": 9, "room_id": "CR-101"}
    ]
    result = validator.validate(timetable_slots=slots)
    assert result["soft_penalty"] > 0
    breakdown = result["soft_breakdown"]
    assert breakdown["faculty_avoid_preference"] >= 10
    assert breakdown["student_group_gap"] >= 5
    assert breakdown["period_9_session"] >= 5
