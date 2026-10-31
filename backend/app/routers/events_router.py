"""FastAPI Router for Campus Event Management & Approval Workflows.

Provides:
- Event proposal creation & registration.
- Club and department event calendars.
- Expected attendance tracking vs venue capacities.
- Venue and specialized equipment recommendations based on room size & lab assets.
- Multi-stage event approval workflows (`draft` -> `submitted` -> `approved` / `rejected`).
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Room, BookingRequest
from ..auth import get_current_user, get_optional_current_user, require_role, User
from ..mongodb import get_events_collection, get_equipment_collection

router = APIRouter(prefix="/api/events", tags=["Event Management"])


@router.get("/list")
def list_campus_events(
    department: Optional[str] = Query(None),
    organizer_type: Optional[str] = Query(None, description="club, department, institute"),
    status: Optional[str] = Query(None)
):
    """Returns active campus events and registrations."""
    col = get_events_collection()
    query = {}
    if department:
        query["department"] = department
    if organizer_type:
        query["organizer_type"] = organizer_type
    if status:
        query["status"] = status

    events = col.find(query)
    for e in events:
        e.pop("_id", None)

    return {
        "count": len(events),
        "events": events
    }


@router.get("/recommendations")
def recommend_venue_and_equipment(
    attendance: int = Query(..., ge=5, description="Expected attendee count"),
    event_type: str = Query(..., description="hackathon, guest_lecture, workshop, cultural, conference"),
    needs_lab: bool = Query(False, description="Whether specialized laboratory equipment is required"),
    db: Session = Depends(get_db)
):
    """Intelligently suggests optimal campus venues and equipment for an event."""
    rooms = db.query(Room).all()

    # Suitable rooms by capacity (capacity >= attendance)
    valid_rooms = [r for r in rooms if r.capacity >= attendance]
    valid_rooms.sort(key=lambda r: r.capacity)  # Best fit lowest surplus

    recommended_rooms = []
    for r in valid_rooms[:4]:
        util_pct = round((attendance / r.capacity * 100), 1)
        recommended_rooms.append({
            "room_id": r.id,
            "room_name": r.name,
            "building": r.building,
            "type": r.type,
            "capacity": r.capacity,
            "utilization_pct": util_pct,
            "accessible": r.accessible,
            "fit_verdict": "OPTIMAL_FIT" if 60 <= util_pct <= 100 else "ADEQUATE"
        })

    # Recommended Equipment
    eq_col = get_equipment_collection()
    eq_items = eq_col.find({"status": "available"})
    recommended_equipment = []

    if needs_lab or event_type in ("hackathon", "workshop"):
        for eq in eq_items:
            if eq.get("category") in ("Computing", "Testing", "Audio-Visual"):
                recommended_equipment.append({
                    "equipment_id": eq.get("equipment_id"),
                    "name": eq.get("name"),
                    "room_id": eq.get("room_id"),
                    "category": eq.get("category")
                })
    else:
        for eq in eq_items:
            if eq.get("category") in ("Audio-Visual", "Prototyping"):
                recommended_equipment.append({
                    "equipment_id": eq.get("equipment_id"),
                    "name": eq.get("name"),
                    "room_id": eq.get("room_id"),
                    "category": eq.get("category")
                })

    return {
        "expected_attendance": attendance,
        "event_type": event_type,
        "recommended_venues": recommended_rooms,
        "recommended_equipment": recommended_equipment[:5]
    }


@router.post("/create")
def create_event(
    payload: Dict[str, Any] = Body(...),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Submits a new campus event proposal with venue & equipment requests."""
    title = payload.get("title")
    organizer = payload.get("organizer", "CIT Tech Club")
    organizer_type = payload.get("organizer_type", "club")  # club, department, institute
    department = payload.get("department", "CSE")
    expected_attendance = payload.get("expected_attendance", 50)
    proposed_date = payload.get("proposed_date", "2026-10-15")
    proposed_venue = payload.get("proposed_venue", "LH-1")
    equipment_ids = payload.get("equipment_ids", [])
    description = payload.get("description", "")

    if not title:
        raise HTTPException(status_code=400, detail="Missing required event title.")

    event_id = f"EVT-{int(datetime.utcnow().timestamp())}"

    event_doc = {
        "event_id": event_id,
        "title": title,
        "organizer": organizer,
        "organizer_type": organizer_type,
        "department": department,
        "expected_attendance": expected_attendance,
        "actual_registered_attendees": 0,
        "proposed_date": proposed_date,
        "proposed_venue": proposed_venue,
        "requested_equipment": equipment_ids,
        "description": description,
        "status": "pending_approval",  # pending_approval, approved, rejected
        "submitted_by": current_user.email if current_user else "organizer@cit.edu",
        "created_at": datetime.utcnow().isoformat(),
        "approval_notes": None
    }

    col = get_events_collection()
    col.insert_one(event_doc)
    event_doc.pop("_id", None)

    return {
        "status": "success",
        "message": f"Event '{title}' submitted for administrative review.",
        "event": event_doc
    }


@router.post("/register/{event_id}")
def register_for_event(
    event_id: str,
    payload: Dict[str, Any] = Body(...),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Registers a student or faculty member for an upcoming event."""
    col = get_events_collection()
    evt = col.find_one({"event_id": event_id})
    if not evt:
        raise HTTPException(status_code=404, detail=f"Event '{event_id}' not found.")

    user_email = payload.get("user_email") or (current_user.email if current_user else "student@cit.edu")
    user_name = payload.get("user_name") or (current_user.name if current_user else "Student Attendee")

    # Increment registered attendees
    col.update_one(
        {"event_id": event_id},
        {"$inc": {"actual_registered_attendees": 1}}
    )

    return {
        "status": "success",
        "message": f"Successfully registered {user_name} ({user_email}) for '{evt.get('title')}'.",
        "event_id": event_id
    }


@router.post("/approve/{event_id}")
def approve_event(
    event_id: str,
    payload: Dict[str, Any] = Body(...),
    current_user: User = Depends(require_role(["admin", "department_coordinator"]))
):
    """Admin/Coordinator approval or rejection of an event."""
    col = get_events_collection()
    evt = col.find_one({"event_id": event_id})
    if not evt:
        raise HTTPException(status_code=404, detail=f"Event '{event_id}' not found.")

    decision = payload.get("decision", "approved")  # approved or rejected
    notes = payload.get("notes", "Event complies with campus policy and venue availability verified.")

    col.update_one(
        {"event_id": event_id},
        {"$set": {
            "status": decision,
            "approval_notes": notes,
            "approved_by": current_user.email,
            "decided_at": datetime.utcnow().isoformat()
        }}
    )

    return {
        "status": "success",
        "message": f"Event '{event_id}' has been {decision.upper()} by {current_user.email}.",
        "event_id": event_id,
        "status_now": decision
    }
