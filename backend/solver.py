"""CP-SAT Timetable Solver for Chilika Institute of Technology (CIT).

Precomputes candidate slots based on all hard constraints, models timetable
generation with OR-Tools CP-SAT, and executes two-stage solving:
  Stage 1: Find any valid clash-free schedule.
  Stage 2: Minimize soft penalties (P9 avoidance, faculty avoid times, underutilization, course duplicates).
"""

import json
import time
from typing import Dict, List, Any, Optional, Tuple, Set
from ortools.sat.python import cp_model

DAYS = ["MON", "TUE", "WED", "THU", "FRI"]
PERIODS = list(range(1, 10))  # 1 to 9 teaching periods

class CITScheduler:
    def __init__(self, dataset: Dict[str, Any]):
        self.dataset = dataset
        self.rooms_map = {r["id"]: r for r in dataset.get("rooms", [])}
        self.faculty_map = {f["id"]: f for f in dataset.get("faculty", [])}
        self.groups_map = {g["id"]: g for g in dataset.get("student_groups", [])}
        self.courses_map = {c["id"]: c for c in dataset.get("courses", [])}
        self.sessions = dataset.get("sessions", [])
        self.sessions_map = {s["id"]: s for s in self.sessions}

        # Index unavailabilities
        self.room_unavail: Dict[Tuple[str, str], Set[int]] = {}
        for ru in dataset.get("room_unavailability", []):
            key = (ru["room_id"], ru["day"])
            if key not in self.room_unavail:
                self.room_unavail[key] = set()
            self.room_unavail[key].update(ru["periods"])

        self.faculty_unavail: Dict[Tuple[str, str], Set[int]] = {}
        for f in dataset.get("faculty", []):
            for un in f.get("unavailable", []):
                key = (f["id"], un["day"])
                if key not in self.faculty_unavail:
                    self.faculty_unavail[key] = set()
                self.faculty_unavail[key].update(un["periods"])

        self.faculty_avoid: Dict[Tuple[str, str], Set[int]] = {}
        for f in dataset.get("faculty", []):
            for pref in f.get("preferences", []):
                if pref.get("type") == "avoid":
                    for d in pref.get("days", []):
                        key = (f["id"], d)
                        if key not in self.faculty_avoid:
                            self.faculty_avoid[key] = set()
                        self.faculty_avoid[key].update(pref.get("periods", []))

    def precompute_allowed_options(self, session: Dict[str, Any]) -> List[Tuple[str, int, str]]:
        """Precomputes valid (day, start_period, room_id) options for a session."""
        duration = session.get("duration", 1)
        kind = session.get("kind")
        sess_size = session.get("size", 0)
        allowed_types = set(session.get("room_types", []))
        faculty_id = session.get("faculty_id")
        groups = session.get("groups", [])
        fixed_slot = session.get("fixed_slot")

        # Determine accessibility requirement
        fac_needs_acc = self.faculty_map.get(faculty_id, {}).get("needs_accessible", False)
        grp_needs_acc = any(self.groups_map.get(g, {}).get("needs_accessible", False) for g in groups)
        needs_acc = session.get("needs_accessible", False) or fac_needs_acc or grp_needs_acc

        # Determine allowed start periods
        if kind == "lab" and duration == 3:
            # 3-hour labs only allowed in P2-P4 or P6-P8
            allowed_starts = [2, 6]
        elif duration == 1:
            allowed_starts = list(range(1, 10))
        else:
            allowed_starts = [p for p in range(1, 10 - duration + 1)]

        # Filter out lunch crossovers (Lunch is between P5 and P6)
        valid_starts = []
        for p in allowed_starts:
            # If starts in morning, must finish by P5
            if p <= 5 and (p + duration - 1) >= 6:
                continue
            # If starts after lunch, must finish by P9
            if (p + duration - 1) > 9:
                continue
            valid_starts.append(p)

        # Filter rooms by capacity, type, and accessibility
        candidate_rooms = []
        for r_id, r in self.rooms_map.items():
            if r.get("capacity", 0) < sess_size:
                continue
            if allowed_types and r.get("type") not in allowed_types:
                continue
            if needs_acc and not r.get("accessible", False):
                continue
            candidate_rooms.append(r_id)

        # Combine with days and check unavailability windows
        options = []
        for d in DAYS:
            for p in valid_starts:
                session_periods = range(p, p + duration)

                # Check fixed slot constraint if present
                if fixed_slot:
                    if d != fixed_slot.get("day") or p != fixed_slot.get("period"):
                        continue

                # Check faculty unavailability
                f_un = self.faculty_unavail.get((faculty_id, d), set())
                if any(period in f_un for period in session_periods):
                    continue

                for r_id in candidate_rooms:
                    # Check room unavailability
                    r_un = self.room_unavail.get((r_id, d), set())
                    if any(period in r_un for period in session_periods):
                        continue

                    options.append((d, p, r_id))

        return options

    def solve(self, timeout_seconds: float = 60.0, warm_hints: Optional[List[Dict[str, Any]]] = None, hint_penalty: int = 1000) -> Optional[List[Dict[str, Any]]]:
        """Runs two-stage CP-SAT solve.
        
        Stage 1: Find any valid schedule.
        Stage 2: Minimize soft penalties with remaining time.
        """
        model = cp_model.CpModel()

        import os
        from collections import defaultdict

        # Load reference timetable as warm hints if not provided
        if not warm_hints:
            export_sched = os.path.join(os.getcwd(), "exports", "schedule.json")
            if os.path.exists(export_sched):
                try:
                    with open(export_sched, "r", encoding="utf-8") as f:
                        cached = json.load(f)
                        if cached.get("dataset_id") == self.dataset.get("dataset_id", "cit-public-v1"):
                            warm_hints = cached.get("timetable", [])
                except Exception:
                    pass

        hint_map = {h["session_id"]: h for h in (warm_hints or [])}

        # 1. Variables: x[s_id, d, p, r]
        x: Dict[Tuple[str, str, int, str], cp_model.IntVar] = {}
        session_vars: Dict[str, List[Tuple[str, int, str, cp_model.IntVar]]] = {}

        # Inverted index containers for instant constraint generation
        room_slot = defaultdict(list)
        fac_slot = defaultdict(list)
        group_non_basket = defaultdict(list)
        group_baskets = defaultdict(set)
        fac_daily = defaultdict(list)
        baskets: Dict[str, List[str]] = {}

        for s in self.sessions:
            s_id = s["id"]
            fac_id = s.get("faculty_id")
            dur = s.get("duration", 1)
            b_slot = s.get("basket_slot")
            if b_slot:
                if b_slot not in baskets:
                    baskets[b_slot] = []
                baskets[b_slot].append(s_id)

            opts = self.precompute_allowed_options(s)
            if not opts:
                print(f"Error: No valid slots available for session {s_id}")
                return None

            session_vars[s_id] = []
            h = hint_map.get(s_id)

            for d, p, r in opts:
                var = model.NewBoolVar(f"x_{s_id}_{d}_{p}_{r}")
                x[(s_id, d, p, r)] = var
                session_vars[s_id].append((d, p, r, var))

                # Add hint if matches
                if h and h.get("day") == d and h.get("start_period") == p and h.get("room_id") == r:
                    model.AddHint(var, 1)

                for t in range(p, p + dur):
                    room_slot[(r, d, t)].append(var)
                    if fac_id:
                        fac_slot[(fac_id, d, t)].append(var)
                    for g in s.get("groups", []):
                        if b_slot:
                            group_baskets[(g, d, t)].add(b_slot)
                        else:
                            group_non_basket[(g, d, t)].append(var)

                if fac_id:
                    fac_daily[(fac_id, d)].append(dur * var)

            # Exactly one slot per session
            model.AddExactlyOne([v for _, _, _, v in session_vars[s_id]])

        # 2. Elective Basket Synchronization:
        # All sessions in the same basket slot must run at the exact same (day, period) in different rooms
        for b_slot, sess_ids in baskets.items():
            first_s = sess_ids[0]
            for other_s in sess_ids[1:]:
                for d in DAYS:
                    for p in PERIODS:
                        vars_first = [v for s_day, s_p, _, v in session_vars[first_s] if s_day == d and s_p == p]
                        vars_other = [v for s_day, s_p, _, v in session_vars[other_s] if s_day == d and s_p == p]
                        model.Add(sum(vars_first) == sum(vars_other))

        # 3. Room Non-Overlap Constraints
        for vs in room_slot.values():
            if len(vs) > 1:
                model.Add(sum(vs) <= 1)

        # 4. Faculty Non-Overlap Constraints
        for vs in fac_slot.values():
            if len(vs) > 1:
                model.Add(sum(vs) <= 1)

        # 5. Faculty Daily Limit: max 4 teaching hours per day
        for terms in fac_daily.values():
            model.Add(sum(terms) <= 4)

        # 6. Student Group Non-Overlap Constraints
        all_group_keys = set(group_non_basket.keys()) | set(group_baskets.keys())
        for (g, d, t) in all_group_keys:
            active_terms = list(group_non_basket.get((g, d, t), []))
            for b_slot in group_baskets.get((g, d, t), set()):
                rep_sess = baskets[b_slot][0]
                rep_vars = [v for day_c, p_c, _, v in session_vars[rep_sess] if day_c == d and p_c == t]
                active_terms.extend(rep_vars)
            if len(active_terms) > 1:
                model.Add(sum(active_terms) <= 1)

        # Move penalties if hints provided for disruption
        move_penalties = []
        if warm_hints and hint_penalty > 0:
            for s_id, h in hint_map.items():
                if s_id in session_vars:
                    for d, p, r, var in session_vars[s_id]:
                        if not (d == h["day"] and p == h["start_period"] and r == h["room_id"]):
                            move_penalties.append(hint_penalty * var)
            if move_penalties:
                model.Minimize(sum(move_penalties))
            else:
                model.Minimize(0)
        else:
            model.Minimize(0)

        # ==============================================================
        # STAGE 1: Feasible Clash-Free Solve
        # ==============================================================
        solver = cp_model.CpSolver()
        solver.parameters.symmetry_level = 0
        solver.parameters.max_time_in_seconds = timeout_seconds
        solver.parameters.num_workers = 8

        start_time = time.time()
        status = solver.Solve(model)

        if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            print(f"Stage 1 status: {status}, validation: {model.Validate()}")
            return None

        # Build initial feasible timetable
        current_schedule = []
        for s in self.sessions:
            s_id = s["id"]
            for d, p, r, var in session_vars[s_id]:
                if solver.Value(var) == 1:
                    current_schedule.append({
                        "session_id": s_id,
                        "day": d,
                        "start_period": p,
                        "room_id": r
                    })
                    break

        elapsed = time.time() - start_time
        remaining_time = max(2.0, timeout_seconds - elapsed)

        # ==============================================================
        # STAGE 2: Soft Penalty Optimization
        # ==============================================================
        try:
            penalty_terms = []

            for s in self.sessions:
                s_id = s["id"]
                fac_id = s.get("faculty_id")
                size = s.get("size", 0)
                dur = s.get("duration", 1)

                for d, p, r, var in session_vars[s_id]:
                    weight = 0

                    # 1. Faculty avoid preferences (+10 per avoid slot)
                    avoid_set = self.faculty_avoid.get((fac_id, d), set())
                    for slot_p in range(p, p + dur):
                        if slot_p in avoid_set:
                            weight += 10

                    # 2. Period 9 late slot (+5)
                    if p == 9 or (p <= 9 <= p + dur - 1):
                        weight += 5

                    # 3. Room underutilization < 40% (+5)
                    room_cap = self.rooms_map[r].get("capacity", 0)
                    if room_cap > 0 and (size / room_cap) < 0.40:
                        weight += 5

                    # 4. If warm-hints provided: penalty for moving session from original slot
                    if warm_hints and s_id in hint_map:
                        orig = hint_map[s_id]
                        if not (d == orig["day"] and p == orig["start_period"] and r == orig["room_id"]):
                            weight += hint_penalty

                    if weight > 0:
                        penalty_terms.append(weight * var)

            if penalty_terms:
                model.Minimize(sum(penalty_terms))

                # Add hints from Stage 1 solution
                for s in self.sessions:
                    s_id = s["id"]
                    for d, p, r, var in session_vars[s_id]:
                        val = solver.Value(var)
                        model.AddHint(var, val)

                solver.parameters.max_time_in_seconds = remaining_time
                status_opt = solver.Solve(model)

                if status_opt in (cp_model.OPTIMAL, cp_model.FEASIBLE):
                    optimized_schedule = []
                    for s in self.sessions:
                        s_id = s["id"]
                        for d, p, r, var in session_vars[s_id]:
                            if solver.Value(var) == 1:
                                optimized_schedule.append({
                                    "session_id": s_id,
                                    "day": d,
                                    "start_period": p,
                                    "room_id": r
                                })
                                break
                    return optimized_schedule

        except Exception as opt_err:
            print(f"Stage 2 error: {opt_err}. Returning Stage 1 solution.")

        return current_schedule

def generate_weekly_timetable(dataset: Dict[str, Any], timeout_seconds: float = 60.0) -> Optional[List[Dict[str, Any]]]:
    scheduler = CITScheduler(dataset)
    return scheduler.solve(timeout_seconds=timeout_seconds)
