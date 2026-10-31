import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import BookingRequest, User, AuditLog, Room, TimetableSlot
from ..schemas import ManualBookingCreate
from ..auth import get_current_user, require_role
from .timetable_router import _build_dataset_dict
from ..validator import validate_schedule
from backend.booking_engine import CITBookingEngine
from backend.nlp_service import parse_booking_prompt, explain_decision

router = APIRouter(prefix="/api/bookings", tags=["Venue Bookings"])

@router.get("")
def list_bookings(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all booking requests with optional status filter."""
    query = db.query(BookingRequest)
    if status_filter:
        query = query.filter(BookingRequest.status == status_filter)
    
    bookings = query.order_by(BookingRequest.submitted_at.desc()).all()
    return [
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
            "raw_text": b.raw_text,
            "status": b.status,
            "assigned_day": b.assigned_day,
            "assigned_periods": b.assigned_periods,
            "assigned_room": b.assigned_room,
            "rejection_reason": b.rejection_reason
        }
        for b in bookings
    ]

@router.post("")
def create_manual_booking(
    booking_in: ManualBookingCreate,
    current_user: User = Depends(require_role(["admin", "department_coordinator", "faculty", "club"])),
    db: Session = Depends(get_db)
):
    """Submit a manual venue booking request with pure Python constraint validation.
    
    Zero LLM involvement required.
    """
    dataset = _build_dataset_dict(db)

    next_num = db.query(BookingRequest).count() + 1
    new_id = f"BR-M{next_num:03d}"

    test_booking_allocation = [{
        "booking_id": new_id,
        "day": booking_in.day,
        "periods": booking_in.periods,
        "room_id": booking_in.room_id,
        "status": "approved"
    }]

    existing_approved = [
        {
            "booking_id": b.id,
            "day": b.assigned_day,
            "periods": b.assigned_periods,
            "room_id": b.assigned_room,
            "status": "approved"
        }
        for b in db.query(BookingRequest).filter(BookingRequest.status == "approved").all()
        if b.assigned_day and b.assigned_room
    ]

    all_tested_bookings = existing_approved + test_booking_allocation

    dataset["booking_requests"].append({
        "id": new_id,
        "attendance": booking_in.attendance,
        "room_types": [],
        "needs": booking_in.needs or [],
        "mandatory_for_groups": booking_in.mandatory_for_groups or []
    })

    current_slots = [
        {"session_id": s.session_id, "day": s.day, "start_period": s.start_period, "room_id": s.room_id}
        for s in db.query(TimetableSlot).all()
    ]

    validation_result = validate_schedule(
        dataset=dataset,
        timetable_slots=current_slots,
        booking_allocations=all_tested_bookings
    )

    booking_violations = [
        v for v in validation_result["violations"]
        if new_id in v["entities"]
    ]

    if booking_violations:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Manual booking rejected due to constraint violation",
                "violations": booking_violations
            }
        )

    now_iso = datetime.now().isoformat()
    new_booking = BookingRequest(
        id=new_id,
        submitted_at=now_iso,
        requester=booking_in.requester,
        role=booking_in.role,
        department=booking_in.department,
        requested_category=booking_in.requested_category,
        title=booking_in.title,
        attendance=booking_in.attendance,
        duration_periods=booking_in.duration_periods,
        windows_json=json.dumps([{"day": booking_in.day, "from_period": min(booking_in.periods), "to_period": max(booking_in.periods)}]),
        room_types_json=json.dumps([]),
        needs_json=json.dumps(booking_in.needs or []),
        requested_room=booking_in.room_id,
        mandatory_for_groups_json=json.dumps(booking_in.mandatory_for_groups or []),
        raw_text=booking_in.raw_text or f"Manual booking for {booking_in.title}",
        status="approved",
        assigned_day=booking_in.day,
        assigned_periods_json=json.dumps(booking_in.periods),
        assigned_room=booking_in.room_id
    )
    db.add(new_booking)

    audit = AuditLog(
        user_email=current_user.email,
        role=current_user.role,
        action="MANUAL_BOOKING_CREATED",
        target_type="booking",
        target_id=new_id,
        details_json=json.dumps({
            "title": booking_in.title,
            "room_id": booking_in.room_id,
            "day": booking_in.day,
            "periods": booking_in.periods
        })
    )
    db.add(audit)
    db.commit()

    return {
        "message": "Booking successfully created and approved with zero clashes",
        "booking_id": new_id,
        "assigned_room": booking_in.room_id,
        "day": booking_in.day,
        "periods": booking_in.periods
    }

@router.post("/batch-process")
def process_all_venue_requests(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Processes all venue booking requests in dataset using priority rules and plain code.
    
    No LLM. Returns approval, rejection, or alternative for every request with reasons.
    """
    dataset = _build_dataset_dict(db)

    timetable_slots = [
        {"session_id": s.session_id, "day": s.day, "start_period": s.start_period, "room_id": s.room_id}
        for s in db.query(TimetableSlot).all()
    ]

    engine = CITBookingEngine(dataset, timetable_slots)
    results = []

    from ..models import Cancellation
    cancelled_ids = {c.request_id for c in db.query(Cancellation).all()}

    requests = db.query(BookingRequest).order_by(BookingRequest.submitted_at).all()
    for req in requests:
        if req.status == "cancelled" or req.id in cancelled_ids:
            results.append({
                "request_id": req.id,
                "decision": "cancelled",
                "reason": req.rejection_reason or "Cancelled by requester",
                "assigned_slot": None,
                "alternative": None
            })
            continue

        req_dict = {
            "id": req.id,
            "submitted_at": req.submitted_at,
            "requester": req.requester,
            "role": req.role,
            "department": req.department,
            "requested_category": req.requested_category,
            "title": req.title,
            "attendance": req.attendance,
            "duration_periods": req.duration_periods,
            "windows": req.windows,
            "room_types": req.room_types,
            "needs": req.needs,
            "requested_room": req.requested_room,
            "mandatory_for_groups": req.mandatory_for_groups,
            "series_id": req.series_id
        }

        eval_res = engine.process_request(req_dict)
        results.append(eval_res)

        # Update database record
        req.status = eval_res["decision"]
        if eval_res["decision"] == "approve" and eval_res["assigned_slot"]:
            req.assigned_day = eval_res["assigned_slot"]["day"]
            req.assigned_periods_json = json.dumps(eval_res["assigned_slot"]["periods"])
            req.assigned_room = eval_res["assigned_slot"]["room_id"]
            req.rejection_reason = eval_res["reason"]
        else:
            req.rejection_reason = eval_res["reason"]

    db.commit()

    return {
        "message": f"Processed {len(results)} venue booking requests",
        "decisions": results
    }

@router.post("/nlp-parse")
def nlp_parse_booking_request(
    text: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user)
):
    """Natural-language intake: parses English/Hinglish text into structured booking JSON.
    
    Locks role and event category to authenticated user account (anti-bypass).
    """
    return parse_booking_prompt(
        text=text,
        user_role=current_user.role,
        user_department=current_user.department
    )

@router.post("/explain")
def explain_scheduling_decision(
    decision: str = Body(...),
    rule: Optional[str] = Body(None),
    entities: Optional[List[str]] = Body(None),
    current_user: User = Depends(get_current_user)
):
    """Explains a scheduling or booking decision using factual deterministic templates."""
    explanation = explain_decision(decision=decision, rule=rule, entities=entities)
    return {
        "decision": decision,
        "rule": rule,
        "entities": entities,
        "explanation": explanation
    }

@router.post("/{booking_id}/cancel")
def cancel_booking_request(
    booking_id: str,
    note: str = Body("Cancelled by user", embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancels a booking request and immediately frees its venue slot."""
    booking = db.query(BookingRequest).filter(BookingRequest.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking request not found")

    # Check permission: admin or original requester
    if current_user.role != "admin" and current_user.role != booking.role:
        raise HTTPException(status_code=403, detail="Permission denied to cancel this request")

    # Release slot
    booking.status = "cancelled"
    booking.rejection_reason = f"Cancelled: {note}"
    booking.assigned_day = None
    booking.assigned_periods_json = "[]"
    booking.assigned_room = None

    audit = AuditLog(
        user_email=current_user.email,
        role=current_user.role,
        action="BOOKING_CANCELLED",
        target_type="booking",
        target_id=booking_id,
        details_json=json.dumps({"note": note})
    )
    db.add(audit)
    db.commit()

    return {"message": f"Booking {booking_id} cancelled and slot released.", "status": "cancelled"}
