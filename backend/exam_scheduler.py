"""Midsem Exam Scheduler for Chilika Institute of Technology (CIT).

Schedules all 41 midsem exams in Exam Week (Mon-Sat, AM/PM sessions):
  - Halved room capacity constraint (floor(capacity / 2)).
  - No student group clashes.
  - Multi-room assignment for cohort-wide exams (Year 1 common exams, HS201, OE Basket).
  - Daily limit: at most 1 exam per student group per day.
"""

import json
import math
from typing import Dict, List, Any, Optional, Tuple, Set
from ortools.sat.python import cp_model

EXAM_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"]
EXAM_SESSIONS = ["AM", "PM"]

class CITExamScheduler:
    def __init__(self, dataset: Dict[str, Any]):
        self.dataset = dataset
        self.rooms_map = {r["id"]: r for r in dataset.get("rooms", [])}
        self.groups_map = {g["id"]: g for g in dataset.get("student_groups", [])}
        self.exams = dataset.get("exams", [])
        self.exams_map = {e["id"]: e for e in self.exams}

        # Filter rooms allowed for exams
        self.exam_rooms = {
            r_id: r for r_id, r in self.rooms_map.items()
            if "exam" in r.get("allowed_uses", [])
        }
        # Effective capacity during exams is halved: floor(cap / 2)
        self.effective_capacities = {
            r_id: math.floor(r.get("capacity", 0) / 2)
            for r_id, r in self.exam_rooms.items()
        }

    def solve(self, timeout_seconds: float = 30.0) -> Optional[List[Dict[str, Any]]]:
        model = cp_model.CpModel()

        # Slot options: (day, session)
        slots = [(d, s) for d in EXAM_DAYS for s in EXAM_SESSIONS]
        num_slots = len(slots)  # 12 slots (6 days * 2 sessions)

        # 1. Variables:
        # slot_var[e_id, slot_idx] == 1 if exam is in that slot
        slot_var: Dict[Tuple[str, int], cp_model.IntVar] = {}
        # room_var[e_id, slot_idx, r_id] == 1 if room r is used by exam e in that slot
        room_var: Dict[Tuple[str, int, str], cp_model.IntVar] = {}

        for e in self.exams:
            e_id = e["id"]
            for s_idx in range(num_slots):
                slot_var[(e_id, s_idx)] = model.NewBoolVar(f"slot_{e_id}_{s_idx}")
                for r_id in self.exam_rooms:
                    room_var[(e_id, s_idx, r_id)] = model.NewBoolVar(f"room_{e_id}_{s_idx}_{r_id}")

            # Each exam in exactly one slot
            model.AddExactlyOne([slot_var[(e_id, s_idx)] for s_idx in range(num_slots)])

            # Room usage implies exam is in that slot
            e_size = e.get("size", 0)
            for s_idx in range(num_slots):
                # Capacity constraint: if exam is in slot s_idx, sum of effective room capacities >= e_size
                effective_cap_sum = sum(
                    self.effective_capacities[r_id] * room_var[(e_id, s_idx, r_id)]
                    for r_id in self.exam_rooms
                )
                model.Add(effective_cap_sum >= e_size).OnlyEnforceIf(slot_var[(e_id, s_idx)])

                # If exam is not in slot, no rooms used
                for r_id in self.exam_rooms:
                    model.Add(room_var[(e_id, s_idx, r_id)] <= slot_var[(e_id, s_idx)])

        # 2. Room Non-Overlap Constraints:
        # In any slot, each room can be used by at most 1 exam
        for s_idx in range(num_slots):
            for r_id in self.exam_rooms:
                model.Add(
                    sum(room_var[(e["id"], s_idx, r_id)] for e in self.exams) <= 1
                )

        # 3. Student Group Non-Overlap Constraints:
        # In any slot, a student group can have at most 1 exam
        for s_idx in range(num_slots):
            for g_id in self.groups_map:
                group_exams = [e["id"] for e in self.exams if g_id in e.get("groups", [])]
                if len(group_exams) > 1:
                    model.Add(
                        sum(slot_var[(e_id, s_idx)] for e_id in group_exams) <= 1
                    )

        # 4. Student Welfare: At most 1 exam per student group per day
        for d_idx, d in enumerate(EXAM_DAYS):
            d_slots = [d_idx * 2, d_idx * 2 + 1]  # AM, PM slots for that day
            for g_id in self.groups_map:
                group_exams = [e["id"] for e in self.exams if g_id in e.get("groups", [])]
                if len(group_exams) > 1:
                    model.Add(
                        sum(slot_var[(e_id, s_idx)] for e_id in group_exams for s_idx in d_slots) <= 1
                    )

        # 5. Accessibility Constraint:
        # If any group in exam needs accessibility, at least one assigned room must be accessible
        for e in self.exams:
            e_id = e["id"]
            groups = e.get("groups", [])
            needs_acc = any(self.groups_map.get(g, {}).get("needs_accessible", False) for g in groups)
            if needs_acc:
                acc_rooms = [r_id for r_id, r in self.exam_rooms.items() if r.get("accessible", False)]
                for s_idx in range(num_slots):
                    model.Add(
                        sum(room_var[(e_id, s_idx, r_id)] for r_id in acc_rooms) >= 1
                    ).OnlyEnforceIf(slot_var[(e_id, s_idx)])

        # Solve
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = timeout_seconds
        solver.parameters.num_workers = 4

        status = solver.Solve(model)
        if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            print(f"Exam scheduler failed. Status: {status}")
            return None

        allocations = []
        for e in self.exams:
            e_id = e["id"]
            for s_idx, (d, s_name) in enumerate(slots):
                if solver.Value(slot_var[(e_id, s_idx)]) == 1:
                    used_rooms = [
                        r_id for r_id in self.exam_rooms
                        if solver.Value(room_var[(e_id, s_idx, r_id)]) == 1
                    ]
                    allocations.append({
                        "exam_id": e_id,
                        "day": d,
                        "session": s_name,
                        "rooms": used_rooms
                    })
                    break

        return allocations

def schedule_midsem_exams(dataset: Dict[str, Any], timeout_seconds: float = 30.0) -> Optional[List[Dict[str, Any]]]:
    scheduler = CITExamScheduler(dataset)
    return scheduler.solve(timeout_seconds=timeout_seconds)
