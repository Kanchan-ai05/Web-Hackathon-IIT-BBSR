import json
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import (
    Room,
    Faculty,
    StudentGroup,
    Course,
    Session as SessionModel,
    TimetableSlot,
    CalendarSetting,
    BookingRequest,
    Exam
)
from ..schemas import ScheduleValidationRequest, ValidationResult
from ..validator import validate_schedule
from ..auth import get_current_user

router = APIRouter(prefix="/api/timetable", tags=["Timetable"])

def _build_dataset_dict(db: Session) -> Dict[str, Any]:
    """Assemble current DB state into full dataset dict for validator."""
    cal = db.query(CalendarSetting).first()
    calendar = json.loads(cal.calendar_json) if cal else {}
    priority = json.loads(cal.priority_order_json) if cal else []
    caps = json.loads(cal.role_category_cap_json) if cal else {}

    rooms = [
        {
            "id": r.id,
            "name": r.name,
            "building": r.building,
            "type": r.type,
            "capacity": r.capacity,
            "features": r.features,
            "accessible": r.accessible,
            "allowed_uses": r.allowed_uses
        }
        for r in db.query(Room).all()
    ]

    from ..models import RoomUnavailability
    room_unavail = [
        {
            "room_id": ru.room_id,
            "day": ru.day,
            "periods": ru.periods,
            "reason": ru.reason
        }
        for ru in db.query(RoomUnavailability).all()
    ]

    faculty = [
        {
            "id": f.id,
            "name": f.name,
            "department": f.department,
            "max_hours_per_day": f.max_hours_per_day,
            "needs_accessible": f.needs_accessible,
            "unavailable": f.unavailable,
            "preferences": f.preferences
        }
        for f in db.query(Faculty).all()
    ]

    groups = [
        {
            "id": g.id,
            "name": g.name,
            "year": g.year,
            "department": g.department,
            "size": g.size,
            "needs_accessible": g.needs_accessible
        }
        for g in db.query(StudentGroup).all()
    ]

    courses = [
        {
            "id": c.id,
            "title": c.title,
            "department": c.department,
            "year": c.year,
            "lecture_hours": c.lecture_hours,
            "tutorial_hours": c.tutorial_hours,
            "lab_blocks": c.lab_blocks
        }
        for c in db.query(Course).all()
    ]

    sessions = [
        {
            "id": s.id,
            "course_id": s.course_id,
            "kind": s.kind,
            "groups": s.groups,
            "faculty_id": s.faculty_id,
            "size": s.size,
            "duration": s.duration,
            "room_types": s.room_types,
            "needs_accessible": s.needs_accessible,
            "basket_slot": s.basket_slot,
            "fixed_slot": s.fixed_slot
        }
        for s in db.query(SessionModel).all()
    ]

    bookings = [
        {
            "id": b.id,
            "submitted_at": b.submitted_at,
            "requester": b.requester,
            "role": b.role,
            "department": b.department,
            "requested_category": b.requested_category,
            "title": b.title,
            "attendance": b.attendance,
            "duration_periods": b.duration_periods,
            "windows": b.windows,
            "room_types": b.room_types,
            "needs": b.needs,
            "requested_room": b.requested_room,
            "mandatory_for_groups": b.mandatory_for_groups,
            "series_id": b.series_id,
            "raw_text": b.raw_text
        }
        for b in db.query(BookingRequest).all()
    ]

    exams = [
        {
            "id": ex.id,
            "course_ids": ex.course_ids,
            "groups": ex.groups,
            "size": ex.size,
            "duration_hours": ex.duration_hours
        }
        for ex in db.query(Exam).all()
    ]

    return {
        "dataset_id": cal.dataset_id if cal else "cit-public-v1",
        "institute": cal.institute if cal else "Chilika Institute of Technology",
        "calendar": calendar,
        "priority_order": priority,
        "role_category_cap": caps,
        "rooms": rooms,
        "room_unavailability": room_unavail,
        "faculty": faculty,
        "student_groups": groups,
        "courses": courses,
        "sessions": sessions,
        "booking_requests": bookings,
        "exams": exams
    }

@router.get("/metadata")
def get_timetable_metadata(db: Session = Depends(get_db)):
    """Fetch metadata for grid filtering (rooms, faculty, groups, periods)."""
    dataset = _build_dataset_dict(db)
    return {
        "institute": dataset["institute"],
        "calendar": dataset["calendar"],
        "rooms": [{"id": r["id"], "name": r["name"], "building": r["building"], "type": r["type"], "capacity": r["capacity"], "accessible": r["accessible"]} for r in dataset["rooms"]],
        "faculty": [{"id": f["id"], "name": f["name"], "department": f["department"]} for f in dataset["faculty"]],
        "student_groups": dataset["student_groups"],
        "courses": dataset["courses"],
        "total_sessions": len(dataset["sessions"])
    }

@router.get("")
def get_current_timetable(
    group_id: Optional[str] = None,
    faculty_id: Optional[str] = None,
    room_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve scheduled timetable slots with optional filters."""
    query = db.query(TimetableSlot)
    slots = query.all()

    # Join with session info
    session_map = {s.id: s for s in db.query(SessionModel).all()}
    course_map = {c.id: c for c in db.query(Course).all()}
    faculty_map = {f.id: f for f in db.query(Faculty).all()}
    room_map = {r.id: r for r in db.query(Room).all()}

    results = []
    for slot in slots:
        sess = session_map.get(slot.session_id)
        if not sess:
            continue

        if group_id and group_id not in sess.groups:
            continue
        if faculty_id and sess.faculty_id != faculty_id:
            continue
        if room_id and slot.room_id != room_id:
            continue

        course = course_map.get(sess.course_id)
        fac = faculty_map.get(sess.faculty_id)
        room = room_map.get(slot.room_id)

        results.append({
            "slot_id": slot.id,
            "session_id": slot.session_id,
            "course_id": sess.course_id,
            "course_title": course.title if course else sess.course_id,
            "kind": sess.kind,
            "duration": sess.duration,
            "faculty_id": sess.faculty_id,
            "faculty_name": fac.name if fac else sess.faculty_id,
            "groups": sess.groups,
            "day": slot.day,
            "start_period": slot.start_period,
            "room_id": slot.room_id,
            "room_name": room.name if room else slot.room_id
        })

    return results

@router.post("/validate", response_model=ValidationResult)
def validate_proposed_schedule(
    req: ScheduleValidationRequest,
    db: Session = Depends(get_db)
):
    """Validate a proposed schedule against pure-Python validator."""
    dataset = _build_dataset_dict(db)
    
    timetable_payload = [s.model_dump() for s in (req.timetable or [])]
    bookings_payload = [b.model_dump() for b in (req.bookings or [])]
    exams_payload = [e.model_dump() for e in (req.exams or [])]

    result = validate_schedule(
        dataset=dataset,
        timetable_slots=timetable_payload,
        booking_allocations=bookings_payload,
        exam_allocations=exams_payload
    )
    return result
