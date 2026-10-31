import json
import os
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
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
    Exam,
    AuditLog,
    User
)
from ..schemas import ScheduleValidationRequest, ValidationResult
from ..validator import validate_schedule
from backend.solver import generate_weekly_timetable
from backend.exam_scheduler import schedule_midsem_exams
from backend.rescheduler import CITRescheduler
from ..auth import get_current_user, require_role

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
        "total_sessions": len(dataset["sessions"]),
        "total_exams": len(dataset["exams"])
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

@router.post("/generate")
def generate_full_schedule(
    timeout_seconds: float = 60.0,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Admin endpoint to generate complete timetable and exam schedule using CP-SAT.
    
    Validates output and exports exports/schedule.json.
    """
    dataset = _build_dataset_dict(db)

    # 1. Solve weekly timetable (189 sessions)
    timetable_slots = generate_weekly_timetable(dataset, timeout_seconds=timeout_seconds)
    if not timetable_slots:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="CP-SAT solver could not find a clash-free schedule satisfying all hard constraints."
        )

    # 2. Solve midsem exams (41 exams)
    exam_allocations = schedule_midsem_exams(dataset, timeout_seconds=30.0)
    if not exam_allocations:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="CP-SAT solver could not find a valid exam schedule."
        )

    # 3. Validate with pure Python validator
    validation = validate_schedule(
        dataset=dataset,
        timetable_slots=timetable_slots,
        exam_allocations=exam_allocations
    )

    if not validation["valid"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Generated schedule has hard constraint violations",
                "violations": validation["violations"]
            }
        )

    # 4. Save timetable slots to database
    db.query(TimetableSlot).delete()
    for s in timetable_slots:
        ts = TimetableSlot(
            session_id=s["session_id"],
            day=s["day"],
            start_period=s["start_period"],
            room_id=s["room_id"]
        )
        db.add(ts)

    # Update exams in DB
    for ex in exam_allocations:
        exam_rec = db.query(Exam).filter(Exam.id == ex["exam_id"]).first()
        if exam_rec:
            exam_rec.scheduled_day = ex["day"]
            exam_rec.scheduled_session = ex["session"]
            exam_rec.scheduled_rooms_json = json.dumps(ex["rooms"])

    # 5. Export schedule to exports/schedule.json
    exports_dir = os.path.join(os.getcwd(), "exports")
    os.makedirs(exports_dir, exist_ok=True)
    export_path = os.path.join(exports_dir, "schedule.json")

    export_payload = {
        "dataset_id": dataset.get("dataset_id", "cit-public-v1"),
        "timetable": timetable_slots,
        "exams": exam_allocations,
        "validation": {
            "valid": True,
            "hard_violations_count": 0,
            "soft_penalty": validation["soft_penalty"],
            "soft_breakdown": validation["soft_breakdown"]
        }
    }

    with open(export_path, "w", encoding="utf-8") as f:
        json.dump(export_payload, f, indent=2)

    # 6. Audit log
    audit = AuditLog(
        user_email=current_user.email,
        role=current_user.role,
        action="SCHEDULE_GENERATED",
        target_type="timetable",
        target_id="schedule.json",
        details_json=json.dumps({
            "sessions_count": len(timetable_slots),
            "exams_count": len(exam_allocations),
            "soft_penalty": validation["soft_penalty"]
        })
    )
    db.add(audit)
    db.commit()

    return {
        "message": "Full clash-free schedule generated and validated successfully",
        "sessions_placed": len(timetable_slots),
        "exams_placed": len(exam_allocations),
        "soft_penalty": validation["soft_penalty"],
        "soft_breakdown": validation["soft_breakdown"],
        "export_file": "exports/schedule.json"
    }

@router.post("/manual-schedule")
def manual_schedule_session(
    session_id: str = Body(...),
    day: str = Body(...),
    start_period: int = Body(...),
    room_id: str = Body(...),
    current_user: User = Depends(require_role(["admin", "department_coordinator"])),
    db: Session = Depends(get_db)
):
    """Assigns or moves a session manually for authorized roles.
    
    Strictly validated by validator.py before any database write.
    """
    dataset = _build_dataset_dict(db)

    # Fetch existing timetable
    existing_slots = [
        {"session_id": s.session_id, "day": s.day, "start_period": s.start_period, "room_id": s.room_id}
        for s in db.query(TimetableSlot).all()
        if s.session_id != session_id
    ]

    # New proposed slot
    proposed_slot = {
        "session_id": session_id,
        "day": day,
        "start_period": start_period,
        "room_id": room_id
    }
    candidate_timetable = existing_slots + [proposed_slot]

    # Validate against pure Python validator
    validation = validate_schedule(dataset, timetable_slots=candidate_timetable)
    
    # Check violations related to this change
    clashes = [
        v for v in validation["violations"]
        if session_id in v["entities"] or (v["slot"].get("room") == room_id and v["slot"].get("day") == day)
    ]

    if clashes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "HARD_CONSTRAINT_VIOLATION",
                "message": f"Manual schedule blocked by rule: {clashes[0]['rule']}",
                "violations": clashes
            }
        )

    # If valid, apply to database
    slot_rec = db.query(TimetableSlot).filter(TimetableSlot.session_id == session_id).first()
    if slot_rec:
        slot_rec.day = day
        slot_rec.start_period = start_period
        slot_rec.room_id = room_id
    else:
        slot_rec = TimetableSlot(
            session_id=session_id,
            day=day,
            start_period=start_period,
            room_id=room_id
        )
        db.add(slot_rec)

    # Audit log
    audit = AuditLog(
        user_email=current_user.email,
        role=current_user.role,
        action="MANUAL_SESSION_SCHEDULED",
        target_type="session",
        target_id=session_id,
        details_json=json.dumps({"day": day, "start_period": start_period, "room_id": room_id})
    )
    db.add(audit)
    db.commit()

    return {
        "message": f"Session {session_id} successfully scheduled at {day} P{start_period} in {room_id}",
        "slot": proposed_slot
    }

@router.post("/disrupt")
def preview_disruption_reschedule(
    disruption_spec: Optional[Dict[str, Any]] = Body(None),
    current_user: User = Depends(require_role(["admin", "department_coordinator", "faculty"])),
    db: Session = Depends(get_db)
):
    """Proposes minimal-displacement schedule changes upon disruption.
    
    Saves export to exports/schedule_after.json upon success.
    """
    dataset = _build_dataset_dict(db)

    # Load sample disruption from file if not provided
    if not disruption_spec:
        sample_path = os.path.join(os.getcwd(), "data", "sample_disruption.json")
        if os.path.exists(sample_path):
            with open(sample_path, "r", encoding="utf-8") as f:
                disruption_spec = json.load(f)
        else:
            raise HTTPException(status_code=400, detail="No disruption spec provided and sample_disruption.json not found")

    # Fetch current timetable
    current_slots = [
        {"session_id": s.session_id, "day": s.day, "start_period": s.start_period, "room_id": s.room_id}
        for s in db.query(TimetableSlot).all()
    ]
    if not current_slots:
        # Generate initial timetable if not present
        current_slots = generate_weekly_timetable(dataset, timeout_seconds=30.0)

    rescheduler = CITRescheduler(dataset, current_slots)
    result = rescheduler.reschedule(disruption_spec, timeout_seconds=45.0)

    if result["status"] == "pending_approval" and result["new_timetable"]:
        # Export to exports/schedule_after.json
        exports_dir = os.path.join(os.getcwd(), "exports")
        os.makedirs(exports_dir, exist_ok=True)
        export_path = os.path.join(exports_dir, "schedule_after.json")

        with open(export_path, "w", encoding="utf-8") as f:
            json.dump({
                "disruption_id": disruption_spec.get("disruption_id"),
                "moved_count": result["moved_count"],
                "diff": result["diff"],
                "timetable": result["new_timetable"],
                "soft_penalty": result["soft_penalty"]
            }, f, indent=2)

    return result

@router.post("/disrupt/apply")
def apply_disruption_schedule(
    disruption_id: str = Body(...),
    new_timetable: List[Dict[str, Any]] = Body(...),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Admin endpoint to approve and apply pending disruption schedule."""
    dataset = _build_dataset_dict(db)

    # Validate before applying
    val = validate_schedule(dataset, timetable_slots=new_timetable)
    if not val["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Cannot apply schedule with hard violations", "violations": val["violations"]}
        )

    # Update database
    db.query(TimetableSlot).delete()
    for s in new_timetable:
        ts = TimetableSlot(
            session_id=s["session_id"],
            day=s["day"],
            start_period=s["start_period"],
            room_id=s["room_id"]
        )
        db.add(ts)

    # Audit log
    audit = AuditLog(
        user_email=current_user.email,
        role=current_user.role,
        action="DISRUPTION_SCHEDULE_APPLIED",
        target_type="disruption",
        target_id=disruption_id,
        details_json=json.dumps({"sessions_count": len(new_timetable)})
    )
    db.add(audit)
    db.commit()

    return {"message": "Rescheduled timetable successfully applied by Admin."}

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
