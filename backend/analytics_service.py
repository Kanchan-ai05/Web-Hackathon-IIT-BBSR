"""Campus Intelligence Analytics Service for Chilika Institute of Technology (CIT).

Computes real-time, deterministic metrics across:
  - Room Utilisation Analytics
  - Faculty Workload Analytics
  - Booking Trends & Statistics
  - Timetable Occupancy & Free Periods
  - Department & Day Filtering
  - CSV Export Streaming
"""

import io
import csv
import json
from typing import Dict, List, Any, Optional, Set, Tuple
from collections import defaultdict

DAYS = ["MON", "TUE", "WED", "THU", "FRI"]
PERIODS = list(range(1, 10))

class CITAnalyticsService:
    def __init__(
        self,
        dataset: Dict[str, Any],
        timetable_slots: List[Dict[str, Any]],
        bookings: Optional[List[Dict[str, Any]]] = None
    ):
        self.dataset = dataset
        self.timetable_slots = timetable_slots or []
        self.bookings = bookings or dataset.get("booking_requests", [])

        self.rooms_map = {r["id"]: r for r in dataset.get("rooms", [])}
        self.faculty_map = {f["id"]: f for f in dataset.get("faculty", [])}
        self.groups_map = {g["id"]: g for g in dataset.get("student_groups", [])}
        self.courses_map = {c["id"]: c for c in dataset.get("courses", [])}
        self.sessions_map = {s["id"]: s for s in dataset.get("sessions", [])}

        # Room unavailabilities
        self.room_unavail: Dict[Tuple[str, str], Set[int]] = {}
        for ru in dataset.get("room_unavailability", []):
            key = (ru["room_id"], ru["day"])
            self.room_unavail.setdefault(key, set()).update(ru.get("periods", []))

        # Faculty unavailabilities
        self.faculty_unavail: Dict[Tuple[str, str], Set[int]] = {}
        for f in dataset.get("faculty", []):
            for un in f.get("unavailable", []):
                key = (f["id"], un["day"])
                self.faculty_unavail.setdefault(key, set()).update(un.get("periods", []))

    def get_full_analytics(
        self,
        department_filter: Optional[str] = None,
        day_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """Assembles all campus intelligence metrics with optional department and day filtering."""
        room_analytics = self.get_room_utilisation(department_filter, day_filter)
        faculty_analytics = self.get_faculty_workload(department_filter, day_filter)
        booking_analytics = self.get_booking_analytics(department_filter)
        timetable_analytics = self.get_timetable_analytics(department_filter, day_filter)

        return {
            "filters": {
                "department": department_filter or "All",
                "day": day_filter or "All"
            },
            "summary_kpis": {
                "total_rooms": len(self.rooms_map),
                "total_faculty": len(self.faculty_map),
                "total_sessions": len(self.timetable_slots),
                "total_bookings": len(self.bookings),
                "average_room_utilization_pct": room_analytics["average_utilization_pct"],
                "total_teaching_hours": faculty_analytics["total_teaching_hours"],
                "busiest_room": room_analytics["most_booked_rooms"][0]["room_id"] if room_analytics["most_booked_rooms"] else "N/A",
                "max_workload_faculty": faculty_analytics["max_workload_faculty"]["name"] if faculty_analytics["max_workload_faculty"] else "N/A"
            },
            "room_utilisation": room_analytics,
            "faculty_workload": faculty_analytics,
            "booking_analytics": booking_analytics,
            "timetable_analytics": timetable_analytics
        }

    def get_room_utilisation(
        self,
        department_filter: Optional[str] = None,
        day_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """Calculates room utilization percentages, available vs occupied hours, and top/underutilized rooms."""
        target_days = [day_filter] if day_filter and day_filter in DAYS else DAYS
        total_possible_periods_per_room = len(target_days) * len(PERIODS)  # 45 if all days

        # Track usage: room_id -> count of occupied periods
        room_usage = {r_id: 0 for r_id in self.rooms_map}
        # Department usage: dept -> count of room periods consumed
        dept_room_usage = defaultdict(int)

        # Occupancy by day and period: (day, period) -> count of occupied rooms
        day_period_occupancy = defaultdict(int)

        for slot in self.timetable_slots:
            s_id = slot.get("session_id")
            sess = self.sessions_map.get(s_id, {})
            course = self.courses_map.get(sess.get("course_id"), {})
            course_dept = course.get("department", "Common")

            if department_filter and department_filter != "All" and course_dept != department_filter:
                continue

            day = slot.get("day")
            if day not in target_days:
                continue

            start = slot.get("start_period", 1)
            dur = sess.get("duration", 1)
            room_id = slot.get("room_id")

            for p in range(start, start + dur):
                if room_id in room_usage:
                    room_usage[room_id] += 1
                dept_room_usage[course_dept] += 1
                day_period_occupancy[(day, p)] += 1

        # Also incorporate approved bookings
        for b in self.bookings:
            if b.get("status") == "approved":
                b_dept = b.get("department") or "General"
                if department_filter and department_filter != "All" and b_dept != department_filter:
                    continue

                b_day = b.get("assigned_day")
                if b_day not in target_days:
                    continue

                b_room = b.get("assigned_room")
                periods = b.get("assigned_periods", [])
                for p in periods:
                    if b_room in room_usage:
                        room_usage[b_room] += 1
                    dept_room_usage[b_dept] += 1
                    day_period_occupancy[(b_day, p)] += 1

        # Build room breakdown
        room_list = []
        for r_id, count in room_usage.items():
            r = self.rooms_map[r_id]
            pct = round((count / total_possible_periods_per_room) * 100, 1) if total_possible_periods_per_room > 0 else 0
            room_list.append({
                "room_id": r_id,
                "name": r.get("name", r_id),
                "building": r.get("building", ""),
                "type": r.get("type", "classroom"),
                "capacity": r.get("capacity", 0),
                "accessible": r.get("accessible", False),
                "occupied_hours": count,
                "available_hours": max(total_possible_periods_per_room - count, 0),
                "utilization_pct": pct
            })

        room_list.sort(key=lambda x: x["occupied_hours"], reverse=True)

        avg_utilization = round(sum(r["utilization_pct"] for r in room_list) / len(room_list), 1) if room_list else 0
        most_booked = room_list[:5]
        underutilised = [r for r in room_list if r["utilization_pct"] < 35]

        # Daily occupancy curve
        occupancy_curve = []
        for d in target_days:
            for p in PERIODS:
                occupied_count = day_period_occupancy.get((d, p), 0)
                occupancy_curve.append({
                    "day": d,
                    "period": f"P{p}",
                    "occupied_rooms": occupied_count,
                    "available_rooms": max(len(self.rooms_map) - occupied_count, 0)
                })

        return {
            "total_room_count": len(self.rooms_map),
            "average_utilization_pct": avg_utilization,
            "total_slots_consumed": sum(room_usage.values()),
            "most_booked_rooms": most_booked,
            "underutilised_rooms": underutilised,
            "department_room_consumption": dict(dept_room_usage),
            "daily_occupancy_curve": occupancy_curve,
            "rooms": room_list
        }

    def get_faculty_workload(
        self,
        department_filter: Optional[str] = None,
        day_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """Calculates total teaching hours, daily and weekly loads, and overloaded faculty."""
        target_days = [day_filter] if day_filter and day_filter in DAYS else DAYS

        # faculty_hours: faculty_id -> { "total": int, "by_day": {MON: ..., TUE: ...} }
        faculty_workload = {}
        for f_id, f in self.faculty_map.items():
            dept = f.get("department", "CSE")
            if department_filter and department_filter != "All" and dept != department_filter:
                continue

            faculty_workload[f_id] = {
                "faculty_id": f_id,
                "name": f.get("name", f_id),
                "department": dept,
                "max_hours_per_day": f.get("max_hours_per_day", 4),
                "weekly_hours": 0,
                "daily_hours": {d: 0 for d in DAYS},
                "leave_periods_count": sum(len(self.faculty_unavail.get((f_id, d), set())) for d in DAYS)
            }

        for slot in self.timetable_slots:
            s_id = slot.get("session_id")
            sess = self.sessions_map.get(s_id, {})
            f_id = sess.get("faculty_id")
            dur = sess.get("duration", 1)
            day = slot.get("day")

            if f_id in faculty_workload:
                faculty_workload[f_id]["daily_hours"][day] = faculty_workload[f_id]["daily_hours"].get(day, 0) + dur
                if day in target_days:
                    faculty_workload[f_id]["weekly_hours"] += dur

        faculty_list = list(faculty_workload.values())
        faculty_list.sort(key=lambda x: x["weekly_hours"], reverse=True)

        total_teaching_hours = sum(f["weekly_hours"] for f in faculty_list)
        avg_workload = round(total_teaching_hours / len(faculty_list), 1) if faculty_list else 0
        max_faculty = faculty_list[0] if faculty_list else None

        # Department distribution
        dept_faculty_hours = defaultdict(int)
        dept_faculty_counts = defaultdict(int)
        for f in faculty_list:
            d = f["department"]
            dept_faculty_hours[d] += f["weekly_hours"]
            dept_faculty_counts[d] += 1

        dept_workload_stats = {}
        for d, total_h in dept_faculty_hours.items():
            count = dept_faculty_counts.get(d, 1)
            dept_workload_stats[d] = {
                "total_hours": total_h,
                "faculty_count": count,
                "avg_hours_per_faculty": round(total_h / count, 1)
            }

        return {
            "total_teaching_hours": total_teaching_hours,
            "average_workload_hours": avg_workload,
            "max_workload_faculty": max_faculty,
            "department_workload_distribution": dept_workload_stats,
            "faculty_workload_ranking": faculty_list
        }

    def get_booking_analytics(self, department_filter: Optional[str] = None) -> Dict[str, Any]:
        """Calculates booking status distributions, peak periods, and venue popularity."""
        status_counts = {"approved": 0, "rejected": 0, "pending": 0, "cancelled": 0}
        venue_requests = defaultdict(int)
        period_requests = defaultdict(int)
        dept_requests = defaultdict(int)
        role_requests = defaultdict(int)

        for b in self.bookings:
            dept = b.get("department") or "General"
            if department_filter and department_filter != "All" and dept != department_filter:
                continue

            status = b.get("status", "pending")
            status_counts[status] = status_counts.get(status, 0) + 1

            req_room = b.get("requested_room") or b.get("assigned_room")
            if req_room:
                venue_requests[req_room] += 1

            dept_requests[dept] += 1
            role_requests[b.get("role", "club")] += 1

            for win in b.get("windows", []):
                d = win.get("day", "")
                for p in win.get("periods", []):
                    period_requests[f"{d} P{p}"] += 1

        # Sort peak periods
        sorted_periods = sorted(period_requests.items(), key=lambda x: x[1], reverse=True)[:5]
        peak_periods = [{"period": p, "count": c} for p, c in sorted_periods]

        # Sort venue requests
        sorted_venues = sorted(venue_requests.items(), key=lambda x: x[1], reverse=True)[:5]
        top_venues = [{"room_id": r, "name": self.rooms_map.get(r, {}).get("name", r), "requests_count": c} for r, c in sorted_venues]

        return {
            "total_bookings": sum(status_counts.values()),
            "status_breakdown": status_counts,
            "top_requested_venues": top_venues,
            "peak_booking_periods": peak_periods,
            "department_breakdown": dict(dept_requests),
            "role_breakdown": dict(role_requests)
        }

    def get_timetable_analytics(
        self,
        department_filter: Optional[str] = None,
        day_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """Calculates sessions by department, free periods, and cohort occupancy."""
        target_days = [day_filter] if day_filter and day_filter in DAYS else DAYS
        dept_sessions = defaultdict(int)
        group_periods_occupied = defaultdict(set)

        for slot in self.timetable_slots:
            s_id = slot.get("session_id")
            sess = self.sessions_map.get(s_id, {})
            course = self.courses_map.get(sess.get("course_id"), {})
            dept = course.get("department", "Common")

            if department_filter and department_filter != "All" and dept != department_filter:
                continue

            dept_sessions[dept] += 1

            day = slot.get("day")
            if day in target_days:
                start = slot.get("start_period", 1)
                dur = sess.get("duration", 1)
                for g in sess.get("groups", []):
                    for p in range(start, start + dur):
                        group_periods_occupied[(g, day)].add(p)

        # Free periods analysis per group
        group_free_periods = []
        for g_id, g in self.groups_map.items():
            if department_filter and department_filter != "All" and g.get("department") != department_filter:
                continue

            total_free = 0
            for d in target_days:
                busy_periods = group_periods_occupied.get((g_id, d), set())
                free_count = 9 - len(busy_periods)
                total_free += max(free_count, 0)

            group_free_periods.append({
                "group_id": g_id,
                "name": g.get("name", g_id),
                "department": g.get("department", ""),
                "free_periods_count": total_free,
                "scheduled_periods_count": (len(target_days) * 9) - total_free
            })

        return {
            "total_scheduled_sessions": len(self.timetable_slots),
            "department_sessions": dict(dept_sessions),
            "student_groups_free_periods": group_free_periods
        }

    def generate_csv_report(self, report_type: str = "rooms") -> str:
        """Generates structured CSV formatted content for reports."""
        output = io.StringIO()
        writer = csv.writer(output)

        if report_type == "rooms":
            writer.writerow(["Room ID", "Name", "Building", "Type", "Capacity", "Occupied Hours", "Available Hours", "Utilization %"])
            analytics = self.get_room_utilisation()
            for r in analytics["rooms"]:
                writer.writerow([
                    r["room_id"],
                    r["name"],
                    r["building"],
                    r["type"],
                    r["capacity"],
                    r["occupied_hours"],
                    r["available_hours"],
                    f"{r['utilization_pct']}%"
                ])
        elif report_type == "faculty":
            writer.writerow(["Faculty ID", "Name", "Department", "Weekly Hours", "Max Hours/Day", "Leave Periods"])
            analytics = self.get_faculty_workload()
            for f in analytics["faculty_workload_ranking"]:
                writer.writerow([
                    f["faculty_id"],
                    f["name"],
                    f["department"],
                    f["weekly_hours"],
                    f["max_hours_per_day"],
                    f["leave_periods_count"]
                ])
        elif report_type == "bookings":
            writer.writerow(["Booking ID", "Title", "Requester", "Role", "Category", "Attendance", "Status", "Room", "Day"])
            for b in self.bookings:
                writer.writerow([
                    b.get("id"),
                    b.get("title"),
                    b.get("requester"),
                    b.get("role"),
                    b.get("requested_category"),
                    b.get("attendance"),
                    b.get("status"),
                    b.get("assigned_room") or b.get("requested_room") or "N/A",
                    b.get("assigned_day") or "N/A"
                ])
        else:
            writer.writerow(["Metric", "Value"])
            full = self.get_full_analytics()
            for k, v in full["summary_kpis"].items():
                writer.writerow([k, v])

        return output.getvalue()
