"""Disruption Rescheduling Engine for Chilika Institute of Technology (CIT).

Re-solves timetables upon disruptions (faculty leave, room closed, new session)
using warm-start hints and heavy displacement penalties to minimize moves.
Produces clear before/after diffs and stores pending changes until Admin approval.
"""

import copy
import json
from typing import Dict, List, Any, Optional, Tuple
from .solver import CITScheduler
from .validator import CITValidator, validate_schedule

class CITRescheduler:
    def __init__(self, dataset: Dict[str, Any], current_timetable: List[Dict[str, Any]]):
        self.dataset = copy.deepcopy(dataset)
        self.current_timetable = current_timetable
        self.current_map = {s["session_id"]: s for s in current_timetable}

    def apply_disruption_spec(self, disruption_spec: Dict[str, Any]) -> Dict[str, Any]:
        """Applies leaves, room closures, and new sessions to dataset copy."""
        updated = copy.deepcopy(self.dataset)

        # 1. Apply faculty leaves
        for leave in disruption_spec.get("faculty_leaves", []):
            f_id = leave["faculty_id"]
            day = leave["day"]
            periods = leave.get("periods", list(range(1, 10)))
            reason = leave.get("reason", "On leave")
            for f in updated.get("faculty", []):
                if f["id"] == f_id:
                    if "unavailable" not in f:
                        f["unavailable"] = []
                    f["unavailable"].append({
                        "day": day,
                        "periods": periods,
                        "reason": reason
                    })
                    break

        # 2. Apply room closures
        for closure in disruption_spec.get("room_closures", []):
            r_id = closure["room_id"]
            day = closure["day"]
            periods = closure.get("periods", list(range(1, 10)))
            reason = closure.get("reason", "Room closed / maintenance")
            if "room_unavailability" not in updated:
                updated["room_unavailability"] = []
            updated["room_unavailability"].append({
                "room_id": r_id,
                "day": day,
                "periods": periods,
                "reason": reason
            })

        # 3. Add new sessions
        for new_s in disruption_spec.get("new_sessions", []):
            if "sessions" not in updated:
                updated["sessions"] = []
            # Prevent duplicate IDs
            updated["sessions"] = [s for s in updated["sessions"] if s["id"] != new_s["id"]]
            updated["sessions"].append(new_s)

        return updated

    def reschedule(
        self,
        disruption_spec: Dict[str, Any],
        timeout_seconds: float = 45.0
    ) -> Dict[str, Any]:
        """Re-solves schedule with minimal moves and returns diff."""
        updated_dataset = self.apply_disruption_spec(disruption_spec)

        # Run scheduler with warm hints and high penalty for moves
        scheduler = CITScheduler(updated_dataset)
        new_timetable = scheduler.solve(
            timeout_seconds=timeout_seconds,
            warm_hints=self.current_timetable,
            hint_penalty=2000
        )

        if not new_timetable:
            return {
                "status": "conflict",
                "message": "Cannot resolve disruption without violating hard constraints.",
                "conflicts": [
                    "Requested changes create unresolvable conflicts between faculty leaves, room closures, and class hours.",
                    "Consider relaxing room type constraints or reassigning substitute faculty."
                ],
                "diff": [],
                "moved_count": 0,
                "new_timetable": None
            }

        # Validate resulting schedule
        validation = validate_schedule(updated_dataset, timetable_slots=new_timetable)
        if not validation["valid"]:
            return {
                "status": "conflict",
                "message": "Rescheduled timetable contains hard constraint violations.",
                "conflicts": [f"{v['rule']}: {', '.join(v['entities'])}" for v in validation["violations"]],
                "diff": [],
                "moved_count": 0,
                "new_timetable": None
            }

        # Build before/after diff
        new_map = {s["session_id"]: s for s in new_timetable}
        diff = []

        leaves_fac = {l["faculty_id"]: l for l in disruption_spec.get("faculty_leaves", [])}
        closures_room = {c["room_id"]: c for c in disruption_spec.get("room_closures", [])}
        new_sess_ids = {s["id"] for s in disruption_spec.get("new_sessions", [])}

        for s_id, new_slot in new_map.items():
            if s_id in new_sess_ids:
                diff.append({
                    "session_id": s_id,
                    "old": None,
                    "new": {"day": new_slot["day"], "start_period": new_slot["start_period"], "room_id": new_slot["room_id"]},
                    "why": "Newly added curriculum session scheduled"
                })
                continue

            old_slot = self.current_map.get(s_id)
            if not old_slot:
                continue

            is_moved = (
                old_slot["day"] != new_slot["day"]
                or old_slot["start_period"] != new_slot["start_period"]
                or old_slot["room_id"] != new_slot["room_id"]
            )

            if is_moved:
                sess_info = scheduler.sessions_map.get(s_id, {})
                f_id = sess_info.get("faculty_id")
                r_id = old_slot["room_id"]

                # Explain why it moved
                if f_id in leaves_fac and old_slot["day"] == leaves_fac[f_id]["day"]:
                    why = f"Faculty {f_id} is on leave on {old_slot['day']}"
                elif r_id in closures_room and old_slot["day"] == closures_room[r_id]["day"]:
                    why = f"Room {r_id} is closed for maintenance on {old_slot['day']}"
                else:
                    why = "Shifted to resolve cascade room/group availability"

                diff.append({
                    "session_id": s_id,
                    "old": {"day": old_slot["day"], "start_period": old_slot["start_period"], "room_id": old_slot["room_id"]},
                    "new": {"day": new_slot["day"], "start_period": new_slot["start_period"], "room_id": new_slot["room_id"]},
                    "why": why
                })

        return {
            "status": "pending_approval",
            "disruption_id": disruption_spec.get("disruption_id", "DISRUPTION"),
            "moved_count": len([d for d in diff if d["old"] is not None]),
            "new_sessions_count": len([d for d in diff if d["old"] is None]),
            "diff": diff,
            "new_timetable": new_timetable,
            "soft_penalty": validation["soft_penalty"],
            "updated_dataset": updated_dataset
        }
