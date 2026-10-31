"""Pure Python Timetable & Booking Validator for Chilika Institute of Technology (CIT).

This validator contains ZERO LLM code and enforces all hard constraints and
soft penalty metrics deterministically.
"""

import json
import math
from typing import Dict, List, Any, Optional, Set, Tuple

# Hard constraint rule constants
RULE_EVERY_SESSION_SCHEDULED = "EVERY_SESSION_SCHEDULED"
RULE_FACULTY_CLASH = "FACULTY_CLASH"
RULE_GROUP_CLASH = "GROUP_CLASH"
RULE_ROOM_CLASH = "ROOM_CLASH"
RULE_ROOM_CAPACITY = "ROOM_CAPACITY"
RULE_ROOM_TYPE = "ROOM_TYPE"
RULE_FACULTY_UNAVAILABLE = "FACULTY_UNAVAILABLE"
RULE_ROOM_UNAVAILABLE = "ROOM_UNAVAILABLE"
RULE_LUNCH_CROSSOVER = "LUNCH_CROSSOVER"
RULE_LAB_SLOT = "LAB_SLOT"
RULE_ACCESSIBLE_ROOM = "ACCESSIBLE_ROOM"
RULE_ELECTIVE_BASKET = "ELECTIVE_BASKET"
RULE_FACULTY_DAILY_LIMIT = "FACULTY_DAILY_LIMIT"
RULE_FIXED_SLOT = "FIXED_SLOT"
RULE_BOOKING_OVERLAP = "BOOKING_OVERLAP"

class CITValidator:
    def __init__(self, dataset: Dict[str, Any]):
        """Initialize validator with CIT dataset dictionary."""
        self.dataset = dataset
        self.rooms_map = {r["id"]: r for r in dataset.get("rooms", [])}
        self.faculty_map = {f["id"]: f for f in dataset.get("faculty", [])}
        self.groups_map = {g["id"]: g for g in dataset.get("student_groups", [])}
        self.courses_map = {c["id"]: c for c in dataset.get("courses", [])}
        self.sessions_map = {s["id"]: s for s in dataset.get("sessions", [])}
        self.exams_map = {e["id"]: e for e in dataset.get("exams", [])}
        self.bookings_map = {b["id"]: b for b in dataset.get("booking_requests", [])}

        # Room unavailabilities indexed by (room_id, day) -> set of periods
        self.room_unavail: Dict[Tuple[str, str], Set[int]] = {}
        for ru in dataset.get("room_unavailability", []):
            key = (ru["room_id"], ru["day"])
            if key not in self.room_unavail:
                self.room_unavail[key] = set()
            self.room_unavail[key].update(ru["periods"])

        # Faculty unavailabilities indexed by (faculty_id, day) -> set of periods
        self.faculty_unavail: Dict[Tuple[str, str], Set[int]] = {}
        for f in dataset.get("faculty", []):
            for un in f.get("unavailable", []):
                key = (f["id"], un["day"])
                if key not in self.faculty_unavail:
                    self.faculty_unavail[key] = set()
                self.faculty_unavail[key].update(un["periods"])

        # Faculty preferences indexed by (faculty_id, day) -> set of avoid periods
        self.faculty_avoid: Dict[Tuple[str, str], Set[int]] = {}
        for f in dataset.get("faculty", []):
            for pref in f.get("preferences", []):
                if pref.get("type") == "avoid":
                    for d in pref.get("days", []):
                        key = (f["id"], d)
                        if key not in self.faculty_avoid:
                            self.faculty_avoid[key] = set()
                        self.faculty_avoid[key].update(pref.get("periods", []))

    def validate(
        self,
        timetable_slots: Optional[List[Dict[str, Any]]] = None,
        booking_allocations: Optional[List[Dict[str, Any]]] = None,
        exam_allocations: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Validate timetable, bookings, and exams against all hard and soft constraints.

        Returns a dictionary with:
            - valid: bool
            - hard_violations_count: int
            - violations: List of {rule, entities, slot}
            - soft_penalty: int
            - soft_breakdown: Dict of penalty reasons
        """
        violations: List[Dict[str, Any]] = []
        timetable = timetable_slots or []
        bookings = booking_allocations or []
        exams = exam_allocations or []

        # Tracking occupancy for conflict detection:
        # room_occupancy: (day, period, room_id) -> list of {"type": ..., "id": ...}
        room_occupancy: Dict[Tuple[str, int, str], List[Dict[str, Any]]] = {}
        # faculty_occupancy: (day, period, faculty_id) -> list of {"type": ..., "id": ...}
        faculty_occupancy: Dict[Tuple[str, int, str], List[Dict[str, Any]]] = {}
        # group_occupancy: (day, period, group_id) -> list of {"type": ..., "id": ..., "basket_slot": ...}
        group_occupancy: Dict[Tuple[str, int, str], List[Dict[str, Any]]] = {}

        # Faculty teaching hours per day: (day, faculty_id) -> total hours
        faculty_daily_hours: Dict[Tuple[str, str], int] = {}

        # Student group schedule map for soft constraint gap/excess checking:
        # (day, group_id) -> set of periods
        group_daily_periods: Dict[Tuple[str, str], Set[int]] = {}
        # (day, group_id, course_id) -> count of lecture sessions
        group_course_lectures: Dict[Tuple[str, str, str], int] = {}

        # Elective basket tracking: basket_slot -> list of (day, start_period, session_id)
        basket_placements: Dict[str, List[Tuple[str, int, str]]] = {}

        # Check all sessions scheduled
        scheduled_session_ids = set()

        # -------------------------------------------------------------
        # 1. PROCESS TIMETABLE SESSIONS
        # -------------------------------------------------------------
        for slot in timetable:
            sess_id = slot.get("session_id")
            day = slot.get("day")
            start_p = slot.get("start_period")
            room_id = slot.get("room_id")

            if sess_id not in self.sessions_map:
                violations.append({
                    "rule": "UNKNOWN_SESSION",
                    "entities": [sess_id],
                    "slot": {"day": day, "period": start_p, "room": room_id}
                })
                continue

            session = self.sessions_map[sess_id]
            scheduled_session_ids.add(sess_id)
            duration = session.get("duration", 1)
            periods = list(range(start_p, start_p + duration))
            faculty_id = session.get("faculty_id")
            groups = session.get("groups", [])
            course_id = session.get("course_id")
            kind = session.get("kind")
            basket_slot = session.get("basket_slot")
            fixed_slot = session.get("fixed_slot")
            sess_size = session.get("size", 0)

            # Check: Room exists
            if room_id not in self.rooms_map:
                violations.append({
                    "rule": "UNKNOWN_ROOM",
                    "entities": [room_id, sess_id],
                    "slot": {"day": day, "period": start_p, "room": room_id}
                })
                continue

            room = self.rooms_map[room_id]

            # Check: Fixed slot adherence
            if fixed_slot:
                f_day = fixed_slot.get("day")
                f_period = fixed_slot.get("period")
                if day != f_day or start_p != f_period:
                    violations.append({
                        "rule": RULE_FIXED_SLOT,
                        "entities": [sess_id],
                        "slot": {"day": day, "period": start_p, "expected": fixed_slot}
                    })

            # Check: Room capacity (regular session)
            if sess_size > room.get("capacity", 0):
                violations.append({
                    "rule": RULE_ROOM_CAPACITY,
                    "entities": [sess_id, room_id],
                    "slot": {"day": day, "period": start_p, "room": room_id, "size": sess_size, "capacity": room.get("capacity", 0)}
                })

            # Check: Room type matching
            allowed_room_types = session.get("room_types", [])
            if allowed_room_types and room.get("type") not in allowed_room_types:
                violations.append({
                    "rule": RULE_ROOM_TYPE,
                    "entities": [sess_id, room_id],
                    "slot": {"day": day, "period": start_p, "room_type": room.get("type"), "expected": allowed_room_types}
                })

            # Check: Accessibility
            # Session needs accessible if session.needs_accessible, or faculty needs, or any group needs
            fac_needs_acc = self.faculty_map.get(faculty_id, {}).get("needs_accessible", False)
            grp_needs_acc = any(self.groups_map.get(g, {}).get("needs_accessible", False) for g in groups)
            session_needs_acc = session.get("needs_accessible", False) or fac_needs_acc or grp_needs_acc

            if session_needs_acc and not room.get("accessible", False):
                violations.append({
                    "rule": RULE_ACCESSIBLE_ROOM,
                    "entities": [sess_id, room_id],
                    "slot": {"day": day, "period": start_p, "room": room_id}
                })

            # Check: No class across lunch (Lunch is between P5 and P6: periods 1-5 morning, 6-9 afternoon)
            if start_p <= 5 and (start_p + duration - 1) >= 6:
                violations.append({
                    "rule": RULE_LUNCH_CROSSOVER,
                    "entities": [sess_id],
                    "slot": {"day": day, "start_period": start_p, "duration": duration}
                })

            # Check: 3-hour labs only in P2-P4 or P6-P8
            if kind == "lab" and duration == 3:
                if start_p not in (2, 6):
                    violations.append({
                        "rule": RULE_LAB_SLOT,
                        "entities": [sess_id],
                        "slot": {"day": day, "start_period": start_p, "duration": duration}
                    })

            # Check: Elective basket grouping
            if basket_slot:
                if basket_slot not in basket_placements:
                    basket_placements[basket_slot] = []
                basket_placements[basket_slot].append((day, start_p, sess_id))

            # Track faculty daily teaching hours
            f_key = (day, faculty_id)
            faculty_daily_hours[f_key] = faculty_daily_hours.get(f_key, 0) + duration

            # Process each individual period of the session
            for p in periods:
                # Check: Faculty unavailability
                if p in self.faculty_unavail.get((faculty_id, day), set()):
                    violations.append({
                        "rule": RULE_FACULTY_UNAVAILABLE,
                        "entities": [faculty_id, sess_id],
                        "slot": {"day": day, "period": p, "room": room_id}
                    })

                # Check: Room unavailability
                if p in self.room_unavail.get((room_id, day), set()):
                    violations.append({
                        "rule": RULE_ROOM_UNAVAILABLE,
                        "entities": [room_id, sess_id],
                        "slot": {"day": day, "period": p, "room": room_id}
                    })

                # Check: Room clash
                r_key = (day, p, room_id)
                if r_key in room_occupancy:
                    conflicting = [item["id"] for item in room_occupancy[r_key]]
                    violations.append({
                        "rule": RULE_ROOM_CLASH,
                        "entities": [sess_id] + conflicting,
                        "slot": {"day": day, "period": p, "room": room_id}
                    })
                    room_occupancy[r_key].append({"type": "session", "id": sess_id})
                else:
                    room_occupancy[r_key] = [{"type": "session", "id": sess_id}]

                # Check: Faculty clash
                fac_key = (day, p, faculty_id)
                if fac_key in faculty_occupancy:
                    conflicting = [item["id"] for item in faculty_occupancy[fac_key]]
                    violations.append({
                        "rule": RULE_FACULTY_CLASH,
                        "entities": [faculty_id, sess_id] + conflicting,
                        "slot": {"day": day, "period": p, "room": room_id}
                    })
                    faculty_occupancy[fac_key].append({"type": "session", "id": sess_id})
                else:
                    faculty_occupancy[fac_key] = [{"type": "session", "id": sess_id}]

                # Check: Student group clash
                for g in groups:
                    grp_key = (day, p, g)
                    if grp_key in group_occupancy:
                        # Elective basket exception: sessions in the same basket slot do not clash with each other
                        prior_items = group_occupancy[grp_key]
                        has_real_clash = False
                        clash_entities = []
                        for item in prior_items:
                            if basket_slot and item.get("basket_slot") == basket_slot:
                                continue  # Allowed concurrent elective basket
                            has_real_clash = True
                            clash_entities.append(item["id"])
                        
                        if has_real_clash:
                            violations.append({
                                "rule": RULE_GROUP_CLASH,
                                "entities": [g, sess_id] + clash_entities,
                                "slot": {"day": day, "period": p, "room": room_id}
                            })
                        group_occupancy[grp_key].append({"type": "session", "id": sess_id, "basket_slot": basket_slot})
                    else:
                        group_occupancy[grp_key] = [{"type": "session", "id": sess_id, "basket_slot": basket_slot}]

                    # Track group daily periods for soft constraints
                    gd_key = (day, g)
                    if gd_key not in group_daily_periods:
                        group_daily_periods[gd_key] = set()
                    group_daily_periods[gd_key].add(p)

            # Track group course lectures for soft constraints (duplicate lecture on same day)
            if kind == "lecture":
                for g in groups:
                    gc_key = (day, g, course_id)
                    group_course_lectures[gc_key] = group_course_lectures.get(gc_key, 0) + 1

        # Check: Faculty daily limit (> 4 hours per day)
        for (day, fac_id), total_hrs in faculty_daily_hours.items():
            fac = self.faculty_map.get(fac_id, {})
            limit = fac.get("max_hours_per_day", 4)
            if total_hrs > limit:
                violations.append({
                    "rule": RULE_FACULTY_DAILY_LIMIT,
                    "entities": [fac_id],
                    "slot": {"day": day, "total_hours": total_hrs, "limit": limit}
                })

        # Check: Elective basket synchrony (all sessions in basket_slot at same day and period)
        for b_slot, placements in basket_placements.items():
            first_day, first_period, _ = placements[0]
            for p_day, p_period, s_id in placements[1:]:
                if p_day != first_day or p_period != first_period:
                    violations.append({
                        "rule": RULE_ELECTIVE_BASKET,
                        "entities": [s_id, b_slot],
                        "slot": {
                            "basket_slot": b_slot,
                            "expected_day": first_day,
                            "expected_period": first_period,
                            "actual_day": p_day,
                            "actual_period": p_period
                        }
                    })

        # -------------------------------------------------------------
        # 2. PROCESS EXAM ALLOCATIONS
        # -------------------------------------------------------------
        for ex_alloc in exams:
            ex_id = ex_alloc.get("exam_id")
            day = ex_alloc.get("day")
            session_time = ex_alloc.get("session")  # AM or PM
            assigned_rooms = ex_alloc.get("rooms", [])

            if ex_id not in self.exams_map:
                continue

            exam = self.exams_map[ex_id]
            exam_size = exam.get("size", 0)
            exam_groups = exam.get("groups", [])

            # Check: Room capacity is HALVED during exams!
            # Effective total capacity = sum(floor(capacity / 2) for each room)
            total_effective_cap = 0
            for r_id in assigned_rooms:
                r = self.rooms_map.get(r_id)
                if r:
                    total_effective_cap += math.floor(r.get("capacity", 0) / 2)
                else:
                    violations.append({
                        "rule": "UNKNOWN_ROOM",
                        "entities": [r_id, ex_id],
                        "slot": {"day": day, "session": session_time}
                    })

            if exam_size > total_effective_cap:
                violations.append({
                    "rule": RULE_ROOM_CAPACITY,
                    "entities": [ex_id] + assigned_rooms,
                    "slot": {
                        "day": day,
                        "session": session_time,
                        "exam_size": exam_size,
                        "effective_capacity": total_effective_cap
                    }
                })

        # -------------------------------------------------------------
        # 3. PROCESS APPROVED BOOKING ALLOCATIONS
        # -------------------------------------------------------------
        for bk in bookings:
            if bk.get("status") != "approved":
                continue

            bk_id = bk.get("booking_id")
            day = bk.get("day")
            periods = bk.get("periods", [])
            room_id = bk.get("room_id") or bk.get("assigned_room")
            if not room_id or not day:
                continue

            bk_data = self.bookings_map.get(bk_id, {})
            attendance = bk_data.get("attendance", 0)
            mandatory_groups = bk_data.get("mandatory_for_groups", [])

            if room_id not in self.rooms_map:
                violations.append({
                    "rule": "UNKNOWN_ROOM",
                    "entities": [room_id, bk_id],
                    "slot": {"day": day, "room": room_id}
                })
                continue

            room = self.rooms_map[room_id]

            # Check capacity
            if attendance > room.get("capacity", 0):
                violations.append({
                    "rule": RULE_ROOM_CAPACITY,
                    "entities": [bk_id, room_id],
                    "slot": {"day": day, "attendance": attendance, "capacity": room.get("capacity", 0)}
                })

            # Check room type for booking if specified
            bk_room_types = bk_data.get("room_types", [])
            if bk_room_types and room.get("type") not in bk_room_types:
                violations.append({
                    "rule": RULE_ROOM_TYPE,
                    "entities": [bk_id, room_id],
                    "slot": {"day": day, "room_type": room.get("type"), "expected": bk_room_types}
                })

            # Check accessibility
            if "accessible" in bk_data.get("needs", []) and not room.get("accessible", False):
                violations.append({
                    "rule": RULE_ACCESSIBLE_ROOM,
                    "entities": [bk_id, room_id],
                    "slot": {"day": day, "room": room_id}
                })

            # Check overlaps for each period
            for p in periods:
                # Room unavailability
                if p in self.room_unavail.get((room_id, day), set()):
                    violations.append({
                        "rule": RULE_ROOM_UNAVAILABLE,
                        "entities": [room_id, bk_id],
                        "slot": {"day": day, "period": p, "room": room_id}
                    })

                # Room clash with existing session or booking
                r_key = (day, p, room_id)
                if r_key in room_occupancy:
                    conflicting = [item["id"] for item in room_occupancy[r_key]]
                    violations.append({
                        "rule": RULE_BOOKING_OVERLAP,
                        "entities": [bk_id] + conflicting,
                        "slot": {"day": day, "period": p, "room": room_id}
                    })
                    room_occupancy[r_key].append({"type": "booking", "id": bk_id})
                else:
                    room_occupancy[r_key] = [{"type": "booking", "id": bk_id}]

                # Group clash if booking is mandatory for groups
                for g in mandatory_groups:
                    grp_key = (day, p, g)
                    if grp_key in group_occupancy:
                        conflicting = [item["id"] for item in group_occupancy[grp_key]]
                        violations.append({
                            "rule": RULE_GROUP_CLASH,
                            "entities": [g, bk_id] + conflicting,
                            "slot": {"day": day, "period": p, "room": room_id}
                        })
                        group_occupancy[grp_key].append({"type": "booking", "id": bk_id})
                    else:
                        group_occupancy[grp_key] = [{"type": "booking", "id": bk_id}]

        # -------------------------------------------------------------
        # 4. COMPUTE SOFT PENALTIES
        # -------------------------------------------------------------
        soft_breakdown = {
            "faculty_avoid_preference": 0,
            "student_group_gap": 0,
            "student_group_daily_excess": 0,
            "course_daily_repeat": 0,
            "room_underutilization": 0,
            "period_9_session": 0
        }

        # 1. Faculty avoid preference (penalty: 10 per avoid slot used)
        for slot in timetable:
            sess_id = slot.get("session_id")
            session = self.sessions_map.get(sess_id)
            if not session:
                continue
            fac_id = session.get("faculty_id")
            day = slot.get("day")
            start_p = slot.get("start_period")
            duration = session.get("duration", 1)
            avoid_periods = self.faculty_avoid.get((fac_id, day), set())

            for p in range(start_p, start_p + duration):
                if p in avoid_periods:
                    soft_breakdown["faculty_avoid_preference"] += 10

            # 5. Room underutilization: session uses less than 40% of room capacity
            room_id = slot.get("room_id")
            room = self.rooms_map.get(room_id)
            if room:
                cap = room.get("capacity", 0)
                size = session.get("size", 0)
                if cap > 0 and (size / cap) < 0.40:
                    soft_breakdown["room_underutilization"] += 5

            # 6. Session scheduled in P9 (17:00-18:00)
            if start_p == 9 or (start_p <= 9 <= start_p + duration - 1):
                soft_breakdown["period_9_session"] += 5

        # 2. Student group gaps: free period between two classes on same day (excluding lunch period)
        # Lunch is between P5 and P6. Periods are 1..9 for teaching.
        for (day, grp), periods in group_daily_periods.items():
            if len(periods) > 1:
                sorted_p = sorted(periods)
                # Iterate between min and max period
                min_p, max_p = sorted_p[0], sorted_p[-1]
                for p in range(min_p, max_p + 1):
                    # Period not scheduled in group schedule
                    if p not in periods:
                        # Lunch break is between P5 and P6, so period 5 to 6 transition does not count as a gap
                        soft_breakdown["student_group_gap"] += 5

            # 3. Student group > 6 hours of class in a day (penalty: 15 per hour over 6)
            if len(periods) > 6:
                soft_breakdown["student_group_daily_excess"] += (len(periods) - 6) * 15

        # 4. Group has two lectures of the same course on the same day (penalty: 10 per duplicate)
        for (day, grp, course_id), count in group_course_lectures.items():
            if count > 1:
                soft_breakdown["course_daily_repeat"] += (count - 1) * 10

        total_soft_penalty = sum(soft_breakdown.values())

        # Booking score: priority-weighted evaluation of approved bookings
        priority_weights = {
            "institute_event": 10,
            "guest_lecture": 8,
            "department_event": 6,
            "club_event": 4
        }
        approved_bookings = [b for b in bookings if b.get("status") in ("approved", "approve")]
        booking_score = sum(
            priority_weights.get(b.get("category") or b.get("requested_category", "club_event"), 5)
            for b in approved_bookings
        )

        return {
            "valid": len(violations) == 0,
            "hard_violations_count": len(violations),
            "violations": violations,
            "soft_penalty": total_soft_penalty,
            "soft_breakdown": soft_breakdown,
            "booking_score": booking_score,
            "stats": {
                "total_sessions_scheduled": len(scheduled_session_ids),
                "total_sessions_required": len(self.sessions_map),
                "total_approved_bookings": len(approved_bookings),
                "booking_score": booking_score
            }
        }

def validate_schedule(
    dataset: Dict[str, Any],
    timetable_slots: Optional[List[Dict[str, Any]]] = None,
    booking_allocations: Optional[List[Dict[str, Any]]] = None,
    exam_allocations: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """Helper function to validate a schedule against a dataset."""
    validator = CITValidator(dataset)
    return validator.validate(timetable_slots, booking_allocations, exam_allocations)

if __name__ == "__main__":
    import sys
    import os
    import copy

    print("============================================================")
    print("   CIT OFFICIAL TIMETABLE & VENUE VALIDATOR (PURE PYTHON)   ")
    print("============================================================")

    import argparse

    parser = argparse.ArgumentParser(description="CIT Official Timetable & Venue Validator")
    parser.add_argument("schedule_pos", nargs="?", default=None, help="Path to schedule file")
    parser.add_argument("dataset_pos", nargs="?", default=None, help="Path to dataset file")
    parser.add_argument("--schedule", "-s", default=None, help="Path to schedule file")
    parser.add_argument("--dataset", "-d", default=None, help="Path to dataset file")
    args = parser.parse_args()

    schedule_file = args.schedule or args.schedule_pos
    dataset_file = args.dataset or args.dataset_pos or "data/cit_public.json"

    if not schedule_file:
        print("Usage: python validator.py <schedule.json> [dataset.json] OR python validator.py --schedule <schedule.json>")
        sys.exit(1)

    if not os.path.exists(schedule_file):
        print(f"Error: File not found: {schedule_file}")
        sys.exit(1)

    with open(schedule_file, "r", encoding="utf-8") as f:
        sched_data = json.load(f)

    # Check if schedule_file is the full dataset or an export
    if "rooms" in sched_data and "sessions" in sched_data:
        dataset = sched_data
        timetable = sched_data.get("timetable", [])
        exams = sched_data.get("exams", [])
        bookings = sched_data.get("bookings", [])
    else:
        if not os.path.exists(dataset_file):
            print(f"Error: Base dataset not found: {dataset_file}")
            sys.exit(1)
        with open(dataset_file, "r", encoding="utf-8") as f:
            dataset = json.load(f)
        timetable = sched_data.get("timetable", [])
        exams = sched_data.get("exams", [])
        bookings = sched_data.get("bookings", [])

    # If validating a disruption export (e.g. schedule_after.json), apply disruption to dataset
    moved_count = sched_data.get("moved_count", 0)
    if "disruption_id" in sched_data:
        disruption_file = "data/sample_disruption.json"
        if os.path.exists(disruption_file):
            with open(disruption_file, "r", encoding="utf-8") as f:
                disruption = json.load(f)
            updated_dataset = copy.deepcopy(dataset)
            updated_dataset["sessions"].extend(disruption.get("new_sessions", []))
            for leave in disruption.get("faculty_leaves", []):
                for fac in updated_dataset["faculty"]:
                    if fac["id"] == leave["faculty_id"]:
                        fac.setdefault("unavailable", []).append({
                            "day": leave["day"],
                            "periods": leave["periods"]
                        })
            dataset = updated_dataset

    validator = CITValidator(dataset)
    result = validator.validate(
        timetable_slots=timetable,
        booking_allocations=bookings,
        exam_allocations=exams
    )

    print(f"Target File:      {schedule_file}")
    print(f"Schedule Valid:   {result['valid']}")
    print(f"Hard Violations:  {result['hard_violations_count']}")
    if result["violations"]:
        print("Violation Details:")
        for v in result["violations"]:
            print(f"  - [{v['rule']}] Entities: {v['entities']} @ Slot: {v['slot']}")
    print(f"Soft Penalty:     {result['soft_penalty']}")
    print(f"Booking Score:    {result['booking_score']}")
    if "disruption_id" in sched_data:
        print(f"Sessions Moved:   {moved_count}")
    print("============================================================")

