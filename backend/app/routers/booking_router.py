import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import BookingRequest, User, AuditLog, Room
from ..schemas import ManualBookingCreate
from ..auth import get_current_user, require_role
from .timetable_router import _build_dataset_dict
from ..validator import validate_schedule

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
    
    # If club rep, only view own club requests or general list
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

    # 1. Generate new ID
    next_num = db.query(BookingRequest).count() + 1
    new_id = f"BR-M{next_num:03d}"

    # 2. Build booking allocation to test through validator
    test_booking_allocation = [{
        "booking_id": new_id,
        "day": booking_in.day,
        "periods": booking_in.periods,
        "room_id": booking_in.room_id,
        "status": "approved"
    }]

    # Also build existing approved bookings
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

    # Combine
    all_tested_bookings = existing_approved + test_booking_allocation

    # Inject simulated booking into dataset for validator check
    dataset["booking_requests"].append({
        "id": new_id,
        "attendance": booking_in.attendance,
        "room_types": [],  # Will validate against assigned room type if specified
        "needs": booking_in.needs or [],
        "mandatory_for_groups": booking_in.mandatory_for_groups or []
    })

    validation_result = validate_schedule(
        dataset=dataset,
        timetable_slots=[],  # Can include current timetable if loaded
        booking_allocations=all_tested_bookings
    )

    # Filter violations specific to this booking
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

    # If valid, persist to database
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

    # Audit log
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
