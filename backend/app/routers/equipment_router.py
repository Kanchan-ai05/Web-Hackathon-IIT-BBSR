"""FastAPI Router for Laboratory & Specialized Equipment Management.

Provides:
- Equipment inventory catalog with real-time operational status.
- Lab equipment availability lookup.
- Equipment reservations with deterministic clash prevention against
  scheduled curriculum lab sessions and maintenance windows.
- Equipment calibration and maintenance records.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Room, Session as SessionModel, TimetableSlot
from ..auth import get_current_user, get_optional_current_user, User
from ..mongodb import get_equipment_collection, get_mongo_db

router = APIRouter(prefix="/api/equipment", tags=["Lab & Equipment Management"])


@router.get("/inventory")
def list_equipment_inventory(
    category: Optional[str] = Query(None, description="Filter by category (Computing, Optics, etc.)"),
    room_id: Optional[str] = Query(None, description="Filter by laboratory room"),
    status: Optional[str] = Query(None, description="available, reserved, maintenance, out_of_order")
):
    """Returns catalog of all specialized laboratory equipment."""
    col = get_equipment_collection()
    query = {}
    if category:
        query["category"] = category
    if room_id:
        query["room_id"] = room_id
    if status:
        query["status"] = status

    items = col.find(query)
    # Remove MongoDB internal IDs for clean serialization
    for it in items:
        it.pop("_id", None)

    return {
        "count": len(items),
        "inventory": items
    }


@router.post("/reserve")
def reserve_equipment(
    payload: Dict[str, Any] = Body(...),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Creates an equipment reservation with deterministic availability verification.
    
    Rule: Prevent reservations when required equipment is unavailable or under maintenance.
    """
    equipment_id = payload.get("equipment_id")
    day = payload.get("day")
    period = payload.get("period")
    duration_hours = payload.get("duration_hours", 1)
    purpose = payload.get("purpose", "Research experiment")
    user_email = payload.get("user_email") or (current_user.email if current_user else "researcher@cit.edu")
    user_name = payload.get("user_name") or (current_user.name if current_user else "CIT Researcher")

    if not equipment_id or not day or not period:
        raise HTTPException(status_code=400, detail="Missing required fields: equipment_id, day, period.")

    col = get_equipment_collection()
    eq = col.find_one({"equipment_id": equipment_id})
    if not eq:
        raise HTTPException(status_code=404, detail=f"Equipment '{equipment_id}' not found.")

    # 1. Check operational status
    if eq.get("status") in ("maintenance", "out_of_order"):
        raise HTTPException(
            status_code=400,
            detail=f"Reservation blocked: Equipment '{eq.get('name')}' is currently under {eq.get('status').upper()}."
        )

    # 2. Check existing equipment reservations
    res_col = get_mongo_db()["cit_equipment_reservations"]
    existing_res = res_col.find_one({
        "equipment_id": equipment_id,
        "day": day,
        "period": period,
        "status": "confirmed"
    })
    if existing_res:
        raise HTTPException(
            status_code=409,
            detail=f"Conflict: Equipment '{eq.get('name')}' is already reserved on {day} Period {period} by {existing_res.get('reserved_by')}."
        )

    # 3. Check laboratory academic class schedule
    lab_room = eq.get("room_id")
    clashing_class = db.query(TimetableSlot).filter(
        TimetableSlot.room_id == lab_room,
        TimetableSlot.day == day,
        TimetableSlot.start_period <= period,
        TimetableSlot.start_period + 1 >= period  # Lab block typically 2 hours
    ).first()

    if clashing_class:
        sess = db.query(SessionModel).filter(SessionModel.id == clashing_class.session_id).first()
        course_name = sess.course_id if sess else clashing_class.session_id
        raise HTTPException(
            status_code=409,
            detail=f"Laboratory Busy: Venue '{lab_room}' has scheduled lab class '{course_name}' on {day} Period {clashing_class.start_period}. Academic classes take precedence over equipment reservation."
        )

    # Record valid reservation
    new_reservation = {
        "reservation_id": f"RES-{equipment_id}-{int(datetime.utcnow().timestamp())}",
        "equipment_id": equipment_id,
        "equipment_name": eq.get("name"),
        "room_id": lab_room,
        "day": day,
        "period": period,
        "duration_hours": duration_hours,
        "purpose": purpose,
        "reserved_by": user_name,
        "reserved_email": user_email,
        "status": "confirmed",
        "created_at": datetime.utcnow().isoformat()
    }

    res_col.insert_one(new_reservation)

    return {
        "status": "success",
        "message": f"Equipment '{eq.get('name')}' successfully reserved for {day} Period {period}.",
        "reservation": new_reservation
    }


@router.get("/reservations")
def list_reservations(
    equipment_id: Optional[str] = Query(None)
):
    """Returns active equipment reservations."""
    col = get_equipment_collection()
    res_col = get_mongo_db()["cit_equipment_reservations"]

    query = {}
    if equipment_id:
        query["equipment_id"] = equipment_id

    reservations = res_col.find(query)
    for r in reservations:
        r.pop("_id", None)

    return {
        "count": len(reservations),
        "reservations": reservations
    }


@router.post("/maintenance-log")
def log_equipment_maintenance(
    payload: Dict[str, Any] = Body(...)
):
    """Logs equipment calibration or maintenance status update."""
    equipment_id = payload.get("equipment_id")
    new_status = payload.get("status", "maintenance")
    notes = payload.get("notes", "Routine preventive calibration")

    if not equipment_id:
        raise HTTPException(status_code=400, detail="Missing equipment_id.")

    col = get_equipment_collection()
    eq = col.find_one({"equipment_id": equipment_id})
    if not eq:
        raise HTTPException(status_code=404, detail=f"Equipment '{equipment_id}' not found.")

    col.update_one(
        {"equipment_id": equipment_id},
        {"$set": {
            "status": new_status,
            "last_maintenance_note": notes,
            "last_maintenance_date": datetime.utcnow().strftime("%Y-%m-%d")
        }}
    )

    return {
        "status": "success",
        "message": f"Equipment '{eq.get('name')}' status updated to '{new_status}'.",
        "equipment_id": equipment_id
    }
