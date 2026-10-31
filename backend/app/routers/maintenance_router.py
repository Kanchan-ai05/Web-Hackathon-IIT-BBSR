"""FastAPI Router for Classroom and Laboratory Maintenance Management.

Provides:
- Issue reporting for classrooms and laboratories (HVAC, electrical, AV, plumbing).
- Maintenance ticket generation & tracking.
- Staff assignment and repair workflow (`reported` -> `assigned` -> `in_progress` -> `resolved`).
- Deterministic Scheduling Engine Integration: Automatically communicates room
  unavailability to RoomUnavailability in the database when room closure is required,
  and releases room upon repair completion.
"""

import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Room, RoomUnavailability, AuditLog
from ..auth import get_current_user, get_optional_current_user, require_role, User
from ..mongodb import get_maintenance_collection

router = APIRouter(prefix="/api/maintenance", tags=["Maintenance Management"])


@router.get("/tickets")
def list_maintenance_tickets(
    room_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None)
):
    """Returns all classroom and laboratory maintenance tickets."""
    col = get_maintenance_collection()
    query = {}
    if room_id:
        query["room_id"] = room_id
    if status:
        query["status"] = status
    if severity:
        query["severity"] = severity

    tickets = col.find(query)
    for t in tickets:
        t.pop("_id", None)

    return {
        "count": len(tickets),
        "tickets": tickets
    }


@router.post("/report")
def report_maintenance_issue(
    payload: Dict[str, Any] = Body(...),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Reports a maintenance issue and automatically creates room unavailability if closure needed."""
    room_id = payload.get("room_id")
    title = payload.get("title")
    category = payload.get("category", "infrastructure")  # hvac, electrical, projector, structural
    severity = payload.get("severity", "Medium")  # Low, Medium, High, Critical
    description = payload.get("description", "")
    requires_closure = payload.get("requires_closure", False)
    day = payload.get("day", "Friday")
    periods = payload.get("periods", [1, 2, 3, 4, 5, 6, 7, 8, 9])
    reporter_email = payload.get("reporter_email") or (current_user.email if current_user else "reporter@cit.edu")

    if not room_id or not title:
        raise HTTPException(status_code=400, detail="Missing required fields: room_id, title.")

    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail=f"Room '{room_id}' does not exist.")

    ticket_id = f"TICK-{room_id}-{int(datetime.utcnow().timestamp())}"
    unavailability_id = None

    # Deterministic Scheduling Engine Integration:
    # If closure required or Critical severity, automatically create RoomUnavailability
    if requires_closure or severity == "Critical":
        unavail = RoomUnavailability(
            room_id=room_id,
            day=day,
            periods_json=json.dumps(periods),
            reason=f"Maintenance Ticket {ticket_id}: {title} ({severity})"
        )
        db.add(unavail)
        db.commit()
        unavailability_id = unavail.id

    ticket_doc = {
        "ticket_id": ticket_id,
        "room_id": room_id,
        "room_name": room.name,
        "building": room.building,
        "title": title,
        "category": category,
        "severity": severity,
        "description": description,
        "status": "reported",
        "requires_closure": requires_closure or severity == "Critical",
        "closure_day": day if requires_closure else None,
        "closure_periods": periods if requires_closure else [],
        "unavailability_id": unavailability_id,
        "assigned_to": None,
        "reported_by": reporter_email,
        "created_at": datetime.utcnow().isoformat(),
        "resolved_at": None,
        "resolution_notes": None
    }

    col = get_maintenance_collection()
    col.insert_one(ticket_doc)

    return {
        "status": "success",
        "message": f"Maintenance ticket '{ticket_id}' logged successfully." + (
            f" Room '{room_id}' automatically registered as UNAVAILABLE on {day} periods {periods}."
            if unavailability_id else ""
        ),
        "ticket": ticket_doc
    }


@router.post("/assign")
def assign_maintenance_staff(
    payload: Dict[str, Any] = Body(...),
    current_user: User = Depends(require_role(["admin", "department_coordinator"]))
):
    """Assigns maintenance staff to a ticket."""
    ticket_id = payload.get("ticket_id")
    staff_name = payload.get("staff_name")

    if not ticket_id or not staff_name:
        raise HTTPException(status_code=400, detail="Missing ticket_id or staff_name.")

    col = get_maintenance_collection()
    t = col.find_one({"ticket_id": ticket_id})
    if not t:
        raise HTTPException(status_code=404, detail=f"Ticket '{ticket_id}' not found.")

    col.update_one(
        {"ticket_id": ticket_id},
        {"$set": {
            "assigned_to": staff_name,
            "status": "assigned",
            "assigned_by": current_user.email,
            "assigned_at": datetime.utcnow().isoformat()
        }}
    )

    return {
        "status": "success",
        "message": f"Ticket '{ticket_id}' assigned to technician {staff_name}.",
        "ticket_id": ticket_id
    }


@router.post("/resolve/{ticket_id}")
def resolve_maintenance_ticket(
    ticket_id: str,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Resolves ticket and automatically releases RoomUnavailability lock if one was held."""
    col = get_maintenance_collection()
    t = col.find_one({"ticket_id": ticket_id})
    if not t:
        raise HTTPException(status_code=404, detail=f"Ticket '{ticket_id}' not found.")

    resolution_notes = payload.get("resolution_notes", "Repairs completed and safety verified.")

    # Remove RoomUnavailability if it was injected
    unavail_id = t.get("unavailability_id")
    if unavail_id:
        unavail = db.query(RoomUnavailability).filter(RoomUnavailability.id == unavail_id).first()
        if unavail:
            db.delete(unavail)
            db.commit()

    col.update_one(
        {"ticket_id": ticket_id},
        {"$set": {
            "status": "resolved",
            "resolved_at": datetime.utcnow().isoformat(),
            "resolution_notes": resolution_notes,
            "resolved_by": current_user.email if current_user else "maintenance.supervisor@cit.edu"
        }}
    )

    return {
        "status": "success",
        "message": f"Ticket '{ticket_id}' resolved." + (" Room closure lifted and venue reopened for scheduling." if unavail_id else ""),
        "ticket_id": ticket_id
    }
