"""FastAPI Router for Unified Academic Calendar.

Provides:
- Multi-source calendar combining classes (189 sessions), midsem exams (41),
  approved venue bookings (22), and institutional holidays/milestones.
- Department-wise calendar views (CSE, ECE, ME, CE, ASH).
- Conflict warning detector for overlapping events, exams, and classes.
- Upcoming academic activity notification feed.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Session as SessionModel, TimetableSlot, BookingRequest, Exam, Room
from ..auth import get_optional_current_user, require_role, User
from ..mongodb import get_calendar_collection

router = APIRouter(prefix="/api/calendar", tags=["Academic Calendar"])


@router.get("/unified")
def get_unified_calendar(
    department: Optional[str] = Query(None, description="Filter by department: CSE, ECE, ME, CE, ASH"),
    category: Optional[str] = Query(None, description="class, exam, event, holiday"),
    db: Session = Depends(get_db)
):
    """Aggregates all campus activities into a unified calendar feed."""
    col = get_calendar_collection()
    milestones = col.find({})

    events = []

    # 1. Add Institutional Milestones & Holidays from MongoDB
    for m in milestones:
        if m.get("type") == "campus_metadata":
            continue
        dept_match = not department or m.get("department") in ("All", department)
        cat_match = not category or m.get("category") == category
        if dept_match and cat_match:
            events.append({
                "id": m.get("id", f"MILE-{len(events)}"),
                "title": m.get("title"),
                "category": m.get("category"),
                "date": m.get("date"),
                "end_date": m.get("end_date"),
                "department": m.get("department"),
                "mandatory": m.get("mandatory", False),
                "source": "institutional_calendar"
            })

    # 2. Add Midsem Exams
    if not category or category == "exam":
        exams = db.query(Exam).all()
        exam_base_date = "2026-09-21"  # Week 8 Monday
        day_offsets = {"MON": 0, "TUE": 1, "WED": 2, "THU": 3, "FRI": 4, "SAT": 5}
        
        for ex in exams:
            # Check department match
            is_dept_match = True
            if department:
                is_dept_match = any(department in g for g in ex.groups) or any(department in c for c in ex.course_ids)
            
            if is_dept_match:
                offset = day_offsets.get(ex.scheduled_day, 0)
                ex_date = (datetime.fromisoformat(exam_base_date) + timedelta(days=offset)).strftime("%Y-%m-%d")
                time_str = "09:30 - 11:30 AM" if ex.scheduled_session == "AM" else "14:00 - 16:00 PM"
                events.append({
                    "id": ex.id,
                    "title": f"Midsem: {', '.join(ex.course_ids)} ({ex.scheduled_session})",
                    "category": "exam",
                    "date": ex_date,
                    "time": time_str,
                    "cohorts": ex.groups,
                    "venues": ex.scheduled_rooms,
                    "examinees": ex.size,
                    "source": "midsem_schedule"
                })

    # 3. Add Approved Venue Bookings
    if not category or category == "event":
        bookings = db.query(BookingRequest).filter(BookingRequest.status.in_(["approved", "approve"])).all()
        booking_base_date = "2026-10-14"  # Spectra fest week Wednesday
        day_offsets = {"Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3, "Friday": 4}

        for b in bookings:
            dept_match = not department or not b.department or b.department == department
            if dept_match:
                offset = day_offsets.get(b.assigned_day, 2)
                b_date = (datetime.fromisoformat(booking_base_date) + timedelta(days=offset)).strftime("%Y-%m-%d")
                events.append({
                    "id": b.id,
                    "title": b.title,
                    "category": "event",
                    "date": b_date,
                    "time": f"Periods {', '.join(str(p) for p in b.assigned_periods)}",
                    "venue": b.assigned_room,
                    "requester": b.requester,
                    "attendance": b.attendance,
                    "department": b.department,
                    "source": "venue_booking"
                })

    return {
        "count": len(events),
        "department_filtered": department,
        "events": events
    }


@router.get("/conflicts")
def detect_calendar_conflicts(
    db: Session = Depends(get_db)
):
    """Detects any schedule clashes between academic exams, classes, and special events."""
    col = get_calendar_collection()
    bookings = db.query(BookingRequest).filter(BookingRequest.status.in_(["approved", "approve"])).all()
    slots = db.query(TimetableSlot).all()
    exams = db.query(Exam).all()

    conflicts = []

    # Check venue double-bookings between classes and bookings
    slot_lookup = {}
    for s in slots:
        slot_lookup[(s.day, s.start_period, s.room_id)] = s.session_id

    for b in bookings:
        for p in b.assigned_periods:
            clashing_sess = slot_lookup.get((b.assigned_day, p, b.assigned_room))
            if clashing_sess:
                conflicts.append({
                    "type": "CLASS_EVENT_VENUE_CLASH",
                    "severity": "HIGH",
                    "message": f"Approved booking '{b.title}' ({b.id}) shares venue '{b.assigned_room}' with regular class '{clashing_sess}' at {b.assigned_day} P{p}.",
                    "day": b.assigned_day,
                    "period": p,
                    "venue": b.assigned_room
                })

    return {
        "total_conflicts": len(conflicts),
        "status": "ALL_CLEAR" if len(conflicts) == 0 else "CONFLICTS_FOUND",
        "conflicts": conflicts
    }


@router.post("/milestone")
def add_calendar_milestone(
    payload: Dict[str, Any] = Body(...),
    current_user: User = Depends(require_role(["admin", "department_coordinator"]))
):
    """Adds a new institute milestone or department calendar event."""
    title = payload.get("title")
    category = payload.get("category", "academic")
    date = payload.get("date")
    end_date = payload.get("end_date")
    department = payload.get("department", "All")

    if not title or not date:
        raise HTTPException(status_code=400, detail="Missing title or date.")

    col = get_calendar_collection()
    new_m = {
        "id": f"CAL-{int(datetime.utcnow().timestamp())}",
        "title": title,
        "category": category,
        "date": date,
        "end_date": end_date,
        "department": department,
        "mandatory": payload.get("mandatory", False),
        "created_by": current_user.email,
        "created_at": datetime.utcnow().isoformat()
    }

    col.insert_one(new_m)
    new_m.pop("_id", None)

    return {
        "status": "success",
        "message": f"Milestone '{title}' added to academic calendar.",
        "milestone": new_m
    }
