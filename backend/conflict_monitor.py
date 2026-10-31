"""Intelligent Conflict Monitoring & Predictive Risk Engine for Chilika Institute of Technology (CIT).

Performs real-time continuous analysis of academic timetable slots, midsem exams,
approved bookings, and pending booking requests using actual project data.
Detects:
  - Faculty scheduling overlaps
  - Student group scheduling overlaps
  - Room booking overlaps
  - Room capacity violations
  - Room-type mismatches
  - Faculty availability conflicts
  - Room maintenance conflicts
Calculates:
  - Deterministic room and booking risk scores (Low, Medium, High, Critical)
  - Potential future overbooking warnings for pending requests
  - High booking demand identification
  - Concrete alternative rooms, dates, and time slot recommendations
"""

import copy
import json
import math
from typing import Dict, List, Any, Optional, Set, Tuple

DAYS = ["MON", "TUE", "WED", "THU", "FRI"]
PERIODS = list(range(1, 10))  # P1 to P9 teaching periods, P10-P13 events

class CITConflictMonitor:
    def __init__(
        self,
        dataset: Dict[str, Any],
        timetable_slots: List[Dict[str, Any]],
        bookings: Optional[List[Dict[str, Any]]] = None,
        exams: Optional[List[Dict[str, Any]]] = None
    ):
        self.dataset = dataset
        self.timetable_slots = timetable_slots or []
        self.bookings = bookings or dataset.get("booking_requests", [])
        self.exams = exams or dataset.get("exams", [])

        self.rooms_map = {r["id"]: r for r in dataset.get("rooms", [])}
        self.faculty_map = {f["id"]: f for f in dataset.get("faculty", [])}
        self.groups_map = {g["id"]: g for g in dataset.get("student_groups", [])}
        self.courses_map = {c["id"]: c for c in dataset.get("courses", [])}
        self.sessions_map = {s["id"]: s for s in dataset.get("sessions", [])}

        # Room unavailabilities indexed by (room_id, day) -> set of periods
        self.room_unavail: Dict[Tuple[str, str], Set[int]] = {}
        self.room_unavail_reasons: Dict[Tuple[str, str, int], str] = {}
        for ru in dataset.get("room_unavailability", []):
            key = (ru["room_id"], ru["day"])
            if key not in self.room_unavail:
                self.room_unavail[key] = set()
            for p in ru.get("periods", []):
                self.room_unavail[key].add(p)
                self.room_unavail_reasons[(ru["room_id"], ru["day"], p)] = ru.get("reason", "Maintenance closure")

        # Faculty unavailabilities indexed by (faculty_id, day) -> set of periods
        self.faculty_unavail: Dict[Tuple[str, str], Set[int]] = {}
        self.faculty_unavail_reasons: Dict[Tuple[str, str, int], str] = {}
        for f in dataset.get("faculty", []):
            for un in f.get("unavailable", []):
                key = (f["id"], un["day"])
                if key not in self.faculty_unavail:
                    self.faculty_unavail[key] = set()
                for p in un.get("periods", []):
                    self.faculty_unavail[key].add(p)
                    self.faculty_unavail_reasons[(f["id"], un["day"], p)] = un.get("reason", "Declared leave / unavailable")

        # Compile occupancy grids
        self._build_occupancy_grids()

    def _build_occupancy_grids(self):
        """Constructs occupancy mappings for rooms, faculty, and student groups."""
        # room_occupancy: (day, period, room_id) -> list of occupants
        self.room_occupancy: Dict[Tuple[str, int, str], List[Dict[str, Any]]] = {}
        # faculty_occupancy: (day, period, faculty_id) -> list of commitments
        self.faculty_occupancy: Dict[Tuple[str, int, str], List[Dict[str, Any]]] = {}
        # group_occupancy: (day, period, group_id) -> list of sessions
        self.group_occupancy: Dict[Tuple[str, int, str], List[Dict[str, Any]]] = {}

        # 1. Timetable sessions
        for slot in self.timetable_slots:
            s_id = slot.get("session_id")
            sess = self.sessions_map.get(s_id, {})
            day = slot.get("day")
            start = slot.get("start_period", 1)
            room_id = slot.get("room_id")
            dur = sess.get("duration", 1)
            fac_id = sess.get("faculty_id")
            groups = sess.get("groups", [])
            basket = sess.get("basket_slot")

            for p in range(start, start + dur):
                # Room
                r_key = (day, p, room_id)
                self.room_occupancy.setdefault(r_key, []).append({
                    "source": "session",
                    "id": s_id,
                    "title": self.courses_map.get(sess.get("course_id"), {}).get("title", s_id),
                    "size": sess.get("size", 0),
                    "kind": sess.get("kind"),
                    "faculty_id": fac_id,
                    "groups": groups,
                    "basket_slot": basket
                })

                # Faculty
                if fac_id:
                    f_key = (day, p, fac_id)
                    self.faculty_occupancy.setdefault(f_key, []).append({
                        "source": "session",
                        "session_id": s_id,
                        "room_id": room_id,
                        "title": self.courses_map.get(sess.get("course_id"), {}).get("title", s_id)
                    })

                # Groups
                for g in groups:
                    g_key = (day, p, g)
                    self.group_occupancy.setdefault(g_key, []).append({
                        "source": "session",
                        "session_id": s_id,
                        "room_id": room_id,
                        "basket_slot": basket
                    })

        # 2. Approved bookings
        for b in self.bookings:
            if b.get("status") == "approved":
                day = b.get("assigned_day")
                room_id = b.get("assigned_room")
                periods = b.get("assigned_periods", [])
                b_id = b.get("id")
                mand_groups = b.get("mandatory_for_groups", [])

                if day and room_id:
                    for p in periods:
                        r_key = (day, p, room_id)
                        self.room_occupancy.setdefault(r_key, []).append({
                            "source": "booking",
                            "id": b_id,
                            "title": b.get("title", b_id),
                            "size": b.get("attendance", 0),
                            "requester": b.get("requester"),
                            "role": b.get("role")
                        })

                        for g in mand_groups:
                            g_key = (day, p, g)
                            self.group_occupancy.setdefault(g_key, []).append({
                                "source": "booking",
                                "booking_id": b_id,
                                "room_id": room_id
                            })

    def detect_all_conflicts(self) -> List[Dict[str, Any]]:
        """Identifies all active scheduling, capacity, type, and availability conflicts."""
        conflicts = []

        # 1. Room Booking & Session Overlaps
        for (day, period, room_id), occupants in self.room_occupancy.items():
            if len(occupants) > 1:
                # Check if all occupants are sessions in the exact same elective basket
                baskets = {occ.get("basket_slot") for occ in occupants if occ.get("basket_slot")}
                if len(baskets) == 1 and None not in baskets and len(occupants) == len([o for o in occupants if o.get("basket_slot")]):
                    # Same elective basket sessions running together (valid only if room accommodates combined size)
                    total_size = sum(occ.get("size", 0) for occ in occupants)
                    cap = self.rooms_map.get(room_id, {}).get("capacity", 0)
                    if total_size > cap:
                        conflicts.append({
                            "id": f"CAP-{room_id}-{day}-P{period}",
                            "type": "CAPACITY_VIOLATION",
                            "severity": "Critical",
                            "entities": [room_id] + [o["id"] for o in occupants],
                            "day": day,
                            "period": period,
                            "reason": f"Combined elective basket sessions ({', '.join(o['id'] for o in occupants)}) total {total_size} students exceeding {room_id} capacity ({cap}).",
                            "recommendations": self._find_alternative_rooms(day, [period], total_size)
                        })
                    continue

                occ_str = ", ".join(str(o.get('source')) + ":" + str(o.get('id')) for o in occupants)
                conflicts.append({
                    "id": f"ROOM-CLASH-{room_id}-{day}-P{period}",
                    "type": "ROOM_OVERLAP",
                    "severity": "Critical",
                    "entities": [room_id] + [o["id"] for o in occupants],
                    "day": day,
                    "period": period,
                    "reason": f"Room {room_id} is simultaneously occupied by multiple events ({occ_str}) on {day} at Period {period}.",
                    "recommendations": self._find_alternative_rooms(day, [period], max(o.get("size", 20) for o in occupants))
                })

        # 2. Faculty Scheduling Overlaps
        for (day, period, fac_id), commitments in self.faculty_occupancy.items():
            if len(commitments) > 1:
                fac_name = self.faculty_map.get(fac_id, {}).get("name", fac_id)
                sess_ids = [c["session_id"] for c in commitments]
                rooms = [c["room_id"] for c in commitments]
                conflicts.append({
                    "id": f"FAC-CLASH-{fac_id}-{day}-P{period}",
                    "type": "FACULTY_OVERLAP",
                    "severity": "Critical",
                    "entities": [fac_id] + sess_ids,
                    "day": day,
                    "period": period,
                    "reason": f"Faculty {fac_name} ({fac_id}) is double-booked across sessions {', '.join(sess_ids)} in rooms {', '.join(rooms)} on {day} Period {period}.",
                    "recommendations": self._find_alternative_slots_for_session(sess_ids[0])
                })

        # 3. Student Group Overlaps
        for (day, period, group_id), sessions in self.group_occupancy.items():
            if len(sessions) > 1:
                # Sessions sharing the same basket slot do not clash
                baskets = {s.get("basket_slot") for s in sessions if s.get("basket_slot")}
                if len(baskets) == 1 and None not in baskets:
                    continue  # Valid synchronized basket
                s_ids = [s.get("session_id") or s.get("booking_id") for s in sessions]
                conflicts.append({
                    "id": f"GRP-CLASH-{group_id}-{day}-P{period}",
                    "type": "GROUP_OVERLAP",
                    "severity": "Critical",
                    "entities": [group_id] + s_ids,
                    "day": day,
                    "period": period,
                    "reason": f"Student group {group_id} has overlapping classes or mandatory events ({', '.join(s_ids)}) on {day} Period {period}.",
                    "recommendations": self._find_alternative_slots_for_session(s_ids[0]) if s_ids else []
                })

        # 4. Room Capacity Violations
        for slot in self.timetable_slots:
            s_id = slot.get("session_id")
            sess = self.sessions_map.get(s_id, {})
            room_id = slot.get("room_id")
            room = self.rooms_map.get(room_id, {})
            sess_size = sess.get("size", 0)
            cap = room.get("capacity", 0)
            if cap > 0 and sess_size > cap:
                conflicts.append({
                    "id": f"CAP-{s_id}-{room_id}",
                    "type": "ROOM_CAPACITY",
                    "severity": "High",
                    "entities": [s_id, room_id],
                    "day": slot.get("day"),
                    "period": slot.get("start_period"),
                    "reason": f"Session {s_id} with size {sess_size} exceeds room {room_id} capacity ({cap}).",
                    "recommendations": self._find_alternative_rooms(slot.get("day"), [slot.get("start_period")], sess_size, sess.get("room_types"))
                })

        # 5. Room Type Mismatches
        for slot in self.timetable_slots:
            s_id = slot.get("session_id")
            sess = self.sessions_map.get(s_id, {})
            room_id = slot.get("room_id")
            room = self.rooms_map.get(room_id, {})
            allowed_types = sess.get("room_types", [])
            r_type = room.get("type")
            if allowed_types and r_type not in allowed_types:
                conflicts.append({
                    "id": f"TYPE-{s_id}-{room_id}",
                    "type": "ROOM_TYPE_MISMATCH",
                    "severity": "High",
                    "entities": [s_id, room_id],
                    "day": slot.get("day"),
                    "period": slot.get("start_period"),
                    "reason": f"Session {s_id} requires room type(s) {', '.join(allowed_types)} but room {room_id} is of type '{r_type}'.",
                    "recommendations": self._find_alternative_rooms(slot.get("day"), [slot.get("start_period")], sess.get("size", 0), allowed_types)
                })

        # 6. Faculty Availability Conflicts (Scheduled during leave)
        for (day, period, fac_id), commitments in self.faculty_occupancy.items():
            if period in self.faculty_unavail.get((fac_id, day), set()):
                fac_name = self.faculty_map.get(fac_id, {}).get("name", fac_id)
                reason = self.faculty_unavail_reasons.get((fac_id, day, period), "Faculty unavailable")
                for c in commitments:
                    s_id = c.get("session_id")
                    conflicts.append({
                        "id": f"UNAVAIL-{fac_id}-{s_id}-{day}-P{period}",
                        "type": "FACULTY_AVAILABILITY_CONFLICT",
                        "severity": "Critical",
                        "entities": [fac_id, s_id],
                        "day": day,
                        "period": period,
                        "reason": f"Faculty {fac_name} ({fac_id}) is scheduled for session {s_id} on {day} Period {period} but is unavailable ({reason}).",
                        "recommendations": self._find_alternative_slots_for_session(s_id)
                    })

        # 7. Room Maintenance Conflicts
        for (day, period, room_id), occupants in self.room_occupancy.items():
            if period in self.room_unavail.get((room_id, day), set()):
                reason = self.room_unavail_reasons.get((room_id, day, period), "Room under maintenance")
                for o in occupants:
                    conflicts.append({
                        "id": f"MAINT-{room_id}-{o['id']}-{day}-P{period}",
                        "type": "ROOM_MAINTENANCE_CONFLICT",
                        "severity": "Critical",
                        "entities": [room_id, o["id"]],
                        "day": day,
                        "period": period,
                        "reason": f"Room {room_id} is occupied by {o['source']} {o['id']} during scheduled maintenance on {day} Period {period} ({reason}).",
                        "recommendations": self._find_alternative_rooms(day, [period], o.get("size", 20))
                    })

        return conflicts

    def calculate_room_risk_scores(self) -> List[Dict[str, Any]]:
        """Calculates deterministic risk scores (0-100) and demand metrics for every room."""
        room_risks = []
        total_teaching_periods = 45  # 5 days * 9 periods

        # Count pending booking requests per room
        pending_requests_by_room: Dict[str, List[Dict[str, Any]]] = {}
        for b in self.bookings:
            if b.get("status") == "pending":
                req_room = b.get("requested_room")
                if req_room:
                    pending_requests_by_room.setdefault(req_room, []).append(b)

        for r_id, r in self.rooms_map.items():
            cap = r.get("capacity", 0)
            r_type = r.get("type", "classroom")
            is_accessible = r.get("accessible", False)

            # Count occupied periods across Mon-Fri P1-P9
            occupied_periods = 0
            for d in DAYS:
                for p in PERIODS:
                    if (d, p, r_id) in self.room_occupancy:
                        occupied_periods += 1

            utilization_pct = round((occupied_periods / total_teaching_periods) * 100, 1)

            # Check maintenance periods
            maintenance_count = sum(len(self.room_unavail.get((r_id, d), set())) for d in DAYS)

            # Pending requests competing for this room
            pending_competing = pending_requests_by_room.get(r_id, [])
            pending_count = len(pending_competing)

            # Check active hard conflicts in this room
            active_conflicts = 0
            for d in DAYS:
                for p in PERIODS:
                    if len(self.room_occupancy.get((d, p, r_id), [])) > 1:
                        active_conflicts += 1
                    if p in self.room_unavail.get((r_id, d), set()) and (d, p, r_id) in self.room_occupancy:
                        active_conflicts += 1

            # Deterministic Risk Score Formula
            base_risk = (utilization_pct * 0.45)  # Up to 45 pts from utilization
            contention_risk = min(pending_count * 10, 25)  # Up to 25 pts from booking pressure
            maintenance_risk = min(maintenance_count * 5, 10)  # Up to 10 pts from downtime
            conflict_penalty = min(active_conflicts * 20, 20)  # Up to 20 pts from active clashes

            # Accessible rooms or specialized lab types carry extra scarcity weight
            scarcity_bonus = 0
            if is_accessible:
                scarcity_bonus += 5
            if r_type in ["lab_cs", "lab_civil", "workshop"]:
                scarcity_bonus += 5

            score = min(round(base_risk + contention_risk + maintenance_risk + conflict_penalty + scarcity_bonus), 100)

            # Classification
            if score >= 80 or active_conflicts > 0:
                classification = "Critical"
            elif score >= 60:
                classification = "High"
            elif score >= 35:
                classification = "Medium"
            else:
                classification = "Low"

            # Demand category
            if utilization_pct >= 75 or pending_count >= 3:
                demand_level = "High Demand"
            elif utilization_pct >= 40 or pending_count >= 1:
                demand_level = "Moderate Demand"
            else:
                demand_level = "Low Demand"

            room_risks.append({
                "room_id": r_id,
                "room_name": r.get("name", r_id),
                "building": r.get("building", ""),
                "type": r_type,
                "capacity": cap,
                "accessible": is_accessible,
                "utilization_pct": utilization_pct,
                "occupied_periods": occupied_periods,
                "total_periods": total_teaching_periods,
                "pending_requests_count": pending_count,
                "maintenance_periods_count": maintenance_count,
                "active_conflicts_count": active_conflicts,
                "risk_score": score,
                "risk_level": classification,
                "demand_level": demand_level
            })

        room_risks.sort(key=lambda x: x["risk_score"], reverse=True)
        return room_risks

    def detect_predictive_booking_risks(self) -> List[Dict[str, Any]]:
        """Simulates pending booking requests to detect potential future overbooking and compute booking risk scores."""
        booking_risks = []
        room_risks_dict = {r["room_id"]: r for r in self.calculate_room_risk_scores()}

        # Group pending requests by (day, period, room) to detect mutual contention
        pending_occupancy: Dict[Tuple[str, int, str], List[str]] = {}
        for b in self.bookings:
            if b.get("status") == "pending":
                req_room = b.get("requested_room")
                windows = b.get("windows", [])
                for win in windows:
                    day = win.get("day")
                    periods = win.get("periods", [])
                    if req_room and day:
                        for p in periods:
                            pending_occupancy.setdefault((day, p, req_room), []).append(b.get("id"))

        for b in self.bookings:
            b_id = b.get("id")
            status = b.get("status", "pending")
            role = b.get("role", "club")
            category = b.get("requested_category", "club_event")
            attendance = b.get("attendance", 0)
            req_room = b.get("requested_room")
            windows = b.get("windows", [])
            mand_groups = b.get("mandatory_for_groups", [])

            # We evaluate both pending and approved requests
            clashes_found = []
            competitor_requests = set()
            capacity_tightness = 0.0

            if req_room and req_room in self.rooms_map:
                room_cap = self.rooms_map[req_room].get("capacity", 1)
                capacity_tightness = round((attendance / room_cap) * 100, 1)

            # Check overlap against current schedule for each requested window
            for win in windows:
                day = win.get("day")
                periods = win.get("periods", [])
                if not (day and req_room):
                    continue

                for p in periods:
                    # Check existing room occupancy
                    if (day, p, req_room) in self.room_occupancy:
                        for occ in self.room_occupancy[(day, p, req_room)]:
                            if occ.get("id") != b_id:
                                clashes_found.append({
                                    "day": day,
                                    "period": p,
                                    "with": occ["id"],
                                    "type": occ["source"],
                                    "title": occ.get("title", "")
                                })

                    # Check room maintenance
                    if p in self.room_unavail.get((req_room, day), set()):
                        clashes_found.append({
                            "day": day,
                            "period": p,
                            "with": "MAINTENANCE",
                            "type": "maintenance",
                            "title": self.room_unavail_reasons.get((req_room, day, p), "Maintenance")
                        })

                    # Check competitor pending requests
                    competing = pending_occupancy.get((day, p, req_room), [])
                    for c_id in competing:
                        if c_id != b_id:
                            competitor_requests.add(c_id)

                    # Check group commitments for mandatory groups
                    for g in mand_groups:
                        if (day, p, g) in self.group_occupancy:
                            for occ in self.group_occupancy[(day, p, g)]:
                                if occ.get("booking_id") != b_id:
                                    clashes_found.append({
                                        "day": day,
                                        "period": p,
                                        "with": f"Group {g}",
                                        "type": "group_clash",
                                        "title": f"Group {g} already has scheduled class {occ.get('session_id')}"
                                    })

            # Calculate deterministic booking risk score
            room_risk_item = room_risks_dict.get(req_room, {})
            room_base_risk = room_risk_item.get("risk_score", 30)

            risk_points = 0
            if clashes_found:
                # Direct collision with timetable or approved booking
                risk_points += 50
            if competitor_requests:
                # Overbooking contention: multiple requests for exact same slot
                risk_points += min(len(competitor_requests) * 15, 30)
            if capacity_tightness > 90:
                risk_points += 15
            elif capacity_tightness > 80:
                risk_points += 8

            total_risk = min(round((room_base_risk * 0.4) + risk_points), 100)

            if total_risk >= 80 or len(clashes_found) > 0:
                classification = "Critical"
            elif total_risk >= 60 or len(competitor_requests) > 0:
                classification = "High"
            elif total_risk >= 35:
                classification = "Medium"
            else:
                classification = "Low"

            # Recommendations for alternatives
            recs = []
            if classification in ["Critical", "High"] and windows and req_room:
                first_win = windows[0]
                recs = self._find_alternative_rooms(
                    day=first_win.get("day", "WED"),
                    periods=first_win.get("periods", [10, 11]),
                    size=attendance,
                    preferred_types=b.get("room_types")
                )

            booking_risks.append({
                "booking_id": b_id,
                "title": b.get("title", b_id),
                "requester": b.get("requester", ""),
                "role": role,
                "category": category,
                "requested_room": req_room,
                "status": status,
                "attendance": attendance,
                "capacity_utilization": capacity_tightness,
                "windows": windows,
                "risk_score": total_risk,
                "risk_level": classification,
                "has_collision": len(clashes_found) > 0,
                "collision_details": clashes_found,
                "competing_requests": list(competitor_requests),
                "recommendations": recs
            })

        booking_risks.sort(key=lambda x: x["risk_score"], reverse=True)
        return booking_risks

    def _find_alternative_rooms(
        self,
        day: str,
        periods: List[int],
        size: int,
        preferred_types: Optional[List[str]] = None,
        accessible_needed: bool = False
    ) -> List[Dict[str, Any]]:
        """Finds concrete available alternative rooms of matching type and capacity with zero clash."""
        alternatives = []

        for r_id, r in self.rooms_map.items():
            cap = r.get("capacity", 0)
            r_type = r.get("type")
            is_acc = r.get("accessible", False)

            if cap < size:
                continue
            if preferred_types and r_type not in preferred_types:
                continue
            if accessible_needed and not is_acc:
                continue

            # Check if free for all requested periods
            is_free = True
            for p in periods:
                if (day, p, r_id) in self.room_occupancy:
                    is_free = False
                    break
                if p in self.room_unavail.get((r_id, day), set()):
                    is_free = False
                    break

            if is_free:
                alternatives.append({
                    "room_id": r_id,
                    "name": r.get("name", r_id),
                    "type": r_type,
                    "capacity": cap,
                    "building": r.get("building", ""),
                    "day": day,
                    "periods": periods,
                    "buffer_seats": cap - size
                })

        # Rank by smallest sufficient capacity (minimize waste)
        alternatives.sort(key=lambda a: a["buffer_seats"])
        return alternatives[:4]

    def _find_alternative_slots_for_session(self, session_id: str) -> List[Dict[str, Any]]:
        """Finds alternative (day, period, room) slots for a specific session."""
        sess = self.sessions_map.get(session_id)
        if not sess:
            return []

        size = sess.get("size", 0)
        dur = sess.get("duration", 1)
        fac_id = sess.get("faculty_id")
        groups = sess.get("groups", [])
        room_types = sess.get("room_types", [])
        kind = sess.get("kind")
        needs_acc = sess.get("needs_accessible", False)

        allowed_starts = [p for p in range(1, 10 - dur + 1) if not (p <= 5 and p + dur - 1 >= 6)]
        if kind == "lab" and dur == 3:
            allowed_starts = [2, 6]

        options = []
        for d in DAYS:
            fac_un = self.faculty_unavail.get((fac_id, d), set())
            for p in allowed_starts:
                # Check faculty free
                fac_occupied = any((d, slot_p, fac_id) in self.faculty_occupancy for slot_p in range(p, p + dur))
                fac_leave = any(slot_p in fac_un for slot_p in range(p, p + dur))
                if fac_occupied or fac_leave:
                    continue

                # Check groups free
                groups_busy = any(
                    (d, slot_p, g) in self.group_occupancy
                    for g in groups
                    for slot_p in range(p, p + dur)
                )
                if groups_busy:
                    continue

                # Check available rooms
                alt_rooms = self._find_alternative_rooms(d, list(range(p, p + dur)), size, room_types, needs_acc)
                if alt_rooms:
                    best_room = alt_rooms[0]
                    options.append({
                        "day": d,
                        "start_period": p,
                        "duration": dur,
                        "periods": list(range(p, p + dur)),
                        "room_id": best_room["room_id"],
                        "room_name": best_room["name"],
                        "capacity": best_room["capacity"]
                    })
                    if len(options) >= 3:
                        return options

        return options
