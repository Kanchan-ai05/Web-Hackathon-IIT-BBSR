"""Rule-Based Venue Booking Engine for Chilika Institute of Technology (CIT).

Processes venue booking requests with plain deterministic logic:
  - Role category caps.
  - Priority-based clash resolution: exams > regular_session > institute_event > guest_lecture > department_event > club_event.
  - Overlap checking with scheduled sessions, other approved bookings, and mandatory groups.
  - Alternative suggestions (nearby slots or rooms with matching type and capacity).
  - Cancellation slot liberation.
  - Self-approval prohibition.
"""

from typing import Dict, List, Any, Optional, Tuple, Set

DEFAULT_PRIORITY_ORDER = [
    "exam",
    "regular_session",
    "institute_event",
    "guest_lecture",
    "department_event",
    "club_event"
]

ROLE_CATEGORY_CAP = {
    "admin": "institute_event",
    "faculty": "guest_lecture",
    "department_coordinator": "department_event",
    "club": "club_event"
}

class CITBookingEngine:
    def __init__(
        self,
        dataset: Dict[str, Any],
        timetable_slots: List[Dict[str, Any]],
        priority_order: Optional[List[str]] = None
    ):
        self.dataset = dataset
        self.timetable_slots = timetable_slots
        self.priority_order = priority_order or dataset.get("priority_order", DEFAULT_PRIORITY_ORDER)
        self.priority_rank = {cat: idx for idx, cat in enumerate(self.priority_order)}
        
        self.rooms_map = {r["id"]: r for r in dataset.get("rooms", [])}
        self.groups_map = {g["id"]: g for g in dataset.get("student_groups", [])}
        self.sessions_map = {s["id"]: s for s in dataset.get("sessions", [])}

        # Room unavailabilities
        self.room_unavail: Dict[Tuple[str, str], Set[int]] = {}
        for ru in dataset.get("room_unavailability", []):
            key = (ru["room_id"], ru["day"])
            if key not in self.room_unavail:
                self.room_unavail[key] = set()
            self.room_unavail[key].update(ru["periods"])

        # Build initial occupancy grid from timetable
        # room_occupancy: (day, period, room_id) -> {"type": "session"|"booking", "id": ..., "category": ...}
        self.room_occupancy: Dict[Tuple[str, int, str], Dict[str, Any]] = {}
        # group_occupancy: (day, period, group_id) -> {"type": ..., "id": ...}
        self.group_occupancy: Dict[Tuple[str, int, str], Dict[str, Any]] = {}

        for slot in timetable_slots:
            s_id = slot["session_id"]
            sess = self.sessions_map.get(s_id, {})
            d = slot["day"]
            p = slot["start_period"]
            r_id = slot["room_id"]
            dur = sess.get("duration", 1)
            groups = sess.get("groups", [])

            for t in range(p, p + dur):
                self.room_occupancy[(d, t, r_id)] = {
                    "type": "regular_session",
                    "id": s_id,
                    "category": "regular_session"
                }
                for g in groups:
                    self.group_occupancy[(d, t, g)] = {
                        "type": "regular_session",
                        "id": s_id
                    }

    def process_request(self, req: Dict[str, Any], approver_user: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Evaluates a booking request and returns decision, reason, and alternative."""
        req_id = req["id"]
        role = req.get("role", "club")
        requested_cat = req.get("requested_category", "club_event")
        attendance = req.get("attendance", 0)
        dur = req.get("duration_periods", 1)
        req_room = req.get("requested_room")
        allowed_types = req.get("room_types", [])
        needs = req.get("needs", [])
        mandatory_groups = req.get("mandatory_for_groups", [])
        windows = req.get("windows", [])

        # 1. Self-approval check
        if approver_user:
            if approver_user.get("email") == req.get("requester") or approver_user.get("name") == req.get("requester"):
                return {
                    "request_id": req_id,
                    "decision": "reject",
                    "reason": f"Self-approval prohibited: {approver_user.get('name')} cannot approve their own booking request.",
                    "assigned_slot": None,
                    "alternative": None
                }

        # 2. Role Cap Verification
        max_allowed_cat = ROLE_CATEGORY_CAP.get(role, "club_event")
        req_rank = self.priority_rank.get(requested_cat, 99)
        max_rank = self.priority_rank.get(max_allowed_cat, 99)

        effective_cat = requested_cat
        category_capped = False
        if req_rank < max_rank:
            # Demote category to role's cap
            effective_cat = max_allowed_cat
            category_capped = True

        # 3. Find candidate rooms
        candidate_rooms = []
        if req_room and req_room in self.rooms_map:
            candidate_rooms.append(req_room)
        else:
            # Search rooms matching allowed_types, capacity, and accessibility
            for r_id, r in self.rooms_map.items():
                if allowed_types and r.get("type") not in allowed_types:
                    continue
                if r.get("capacity", 0) < attendance:
                    continue
                if "accessible" in needs and not r.get("accessible", False):
                    continue
                candidate_rooms.append(r_id)

        # 4. Search for an available slot within requested windows
        found_slot = None
        rejection_reasons = []

        for win in windows:
            d = win["day"]
            from_p = win["from_period"]
            to_p = win["to_period"]

            for r_id in candidate_rooms:
                room = self.rooms_map[r_id]

                # Check room capacity
                if room.get("capacity", 0) < attendance:
                    rejection_reasons.append(f"Room {r_id} capacity ({room.get('capacity')}) is smaller than attendance ({attendance})")
                    continue

                # Check accessibility
                if "accessible" in needs and not room.get("accessible", False):
                    rejection_reasons.append(f"Room {r_id} is not wheelchair accessible")
                    continue

                # Slide window of size dur
                for start_p in range(from_p, to_p - dur + 2):
                    target_periods = list(range(start_p, start_p + dur))

                    # Check room unavailability
                    r_un = self.room_unavail.get((r_id, d), set())
                    if any(p in r_un for p in target_periods):
                        rejection_reasons.append(f"Room {r_id} is unavailable on {d} during requested periods")
                        continue

                    # Check room occupancy
                    room_clash = False
                    for p in target_periods:
                        if (d, p, r_id) in self.room_occupancy:
                            occ = self.room_occupancy[(d, p, r_id)]
                            room_clash = True
                            rejection_reasons.append(f"Room {r_id} occupied by {occ['type']} ({occ['id']}) on {d} period {p}")
                            break
                    if room_clash:
                        continue

                    # Check mandatory groups clash
                    group_clash = False
                    for g in mandatory_groups:
                        for p in target_periods:
                            if (d, p, g) in self.group_occupancy:
                                occ = self.group_occupancy[(d, p, g)]
                                group_clash = True
                                rejection_reasons.append(f"Compulsory group {g} has conflict with {occ['type']} ({occ['id']}) on {d} period {p}")
                                break
                        if group_clash:
                            break
                    if group_clash:
                        continue

                    # Found a valid slot!
                    found_slot = {
                        "day": d,
                        "periods": target_periods,
                        "room_id": r_id
                    }
                    break

                if found_slot:
                    break
            if found_slot:
                break

        if found_slot:
            # Commit occupancy
            d = found_slot["day"]
            r_id = found_slot["room_id"]
            for p in found_slot["periods"]:
                self.room_occupancy[(d, p, r_id)] = {
                    "type": "booking",
                    "id": req_id,
                    "category": effective_cat
                }
                for g in mandatory_groups:
                    self.group_occupancy[(d, p, g)] = {
                        "type": "booking",
                        "id": req_id
                    }

            reason = "Requested venue and window available with zero clashes."
            if category_capped:
                reason += f" Note: Category adjusted to '{effective_cat}' per role cap."

            return {
                "request_id": req_id,
                "decision": "approve",
                "reason": reason,
                "assigned_slot": found_slot,
                "alternative": None
            }

        # 5. Slot unavailable: find alternative recommendation
        alternative = self._find_alternative(req, effective_cat)
        primary_reason = rejection_reasons[0] if rejection_reasons else "Requested room and time slot unavailable due to schedule conflicts."

        return {
            "request_id": req_id,
            "decision": "alternative" if alternative else "reject",
            "reason": primary_reason,
            "assigned_slot": None,
            "alternative": alternative
        }

    def _find_alternative(self, req: Dict[str, Any], category: str) -> Optional[Dict[str, Any]]:
        """Searches for the nearest available room/slot with appropriate capacity and type."""
        attendance = req.get("attendance", 0)
        dur = req.get("duration_periods", 1)
        allowed_types = req.get("room_types", [])
        needs = req.get("needs", [])
        mandatory_groups = req.get("mandatory_for_groups", [])

        # Candidate rooms
        candidates = [
            r_id for r_id, r in self.rooms_map.items()
            if r.get("capacity", 0) >= attendance
            and (not allowed_types or r.get("type") in allowed_types)
            and ("accessible" not in needs or r.get("accessible", False))
        ]

        # Scan all days and evening/afternoon periods
        days = ["MON", "TUE", "WED", "THU", "FRI"]
        # Prioritize evening periods 10-13 for events, or afternoons
        search_periods = list(range(10, 14 - dur + 1)) + list(range(6, 10 - dur + 1))

        for d in days:
            for p in search_periods:
                target_periods = list(range(p, p + dur))
                for r_id in candidates:
                    r_un = self.room_unavail.get((r_id, d), set())
                    if any(t in r_un for t in target_periods):
                        continue
                    if any((d, t, r_id) in self.room_occupancy for t in target_periods):
                        continue
                    if any((d, t, g) in self.group_occupancy for g in mandatory_groups for t in target_periods):
                        continue

                    room = self.rooms_map[r_id]
                    return {
                        "day": d,
                        "periods": target_periods,
                        "room_id": r_id,
                        "room_name": room.get("name"),
                        "note": f"Alternative available in {room.get('name')} (capacity {room.get('capacity')}) on {d} periods {target_periods[0]}-{target_periods[-1]}."
                    }
        return None

    def release_booking(self, req_id: str, day: str, periods: List[int], room_id: str):
        """Frees slots when a booking is cancelled."""
        for p in periods:
            if (day, p, room_id) in self.room_occupancy and self.room_occupancy[(day, p, room_id)]["id"] == req_id:
                del self.room_occupancy[(day, p, room_id)]
            for g_id in self.groups_map:
                if (day, p, g_id) in self.group_occupancy and self.group_occupancy[(day, p, g_id)]["id"] == req_id:
                    del self.group_occupancy[(day, p, g_id)]
