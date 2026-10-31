"""FastAPI Router for Campus Emergency Management & Contingency Rescheduling.

Provides:
- Emergency room and building closures (weather alerts, power outage, infrastructure hazards).
- Identification of all affected classes, faculty members, and student cohorts.
- Automated contingency alternative schedule generation (safely relocating to unaffected venues).
- Strict administrative approval gate: Requires authorized Dean/Admin sign-off
  before committing or publishing emergency schedule alterations.
- User emergency notification broadcasts.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Room, Session as SessionModel, TimetableSlot, BookingRequest, Faculty, StudentGroup, AuditLog
from ..auth import get_current_user, require_role, User
from ..mongodb import get_emergency_collection, get_navigation_collection

router = APIRouter(prefix="/api/emergency", tags=["Emergency Management"])


@router.get("/protocols")
def list_emergency_incidents():
    """Returns all active and archived emergency incident protocols."""
    col = get_emergency_collection()
    incidents = col.find({})
    for inc in incidents:
        inc.pop("_id", None)
    return {
        "count": len(incidents),
        "incidents": incidents
    }


@router.post("/lockdown")
def declare_emergency_closure(
    payload: Dict[str, Any] = Body(...),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Declares an emergency closure for a building or specific venues.
    
    Identifies all affected academic sessions, faculty, and student cohorts.
    """
    scope = payload.get("scope", "building")  # building or room
    target_building = payload.get("building")
    target_rooms = payload.get("rooms", [])
    hazard_title = payload.get("title", "Infrastructure Safety Closure")
    severity = payload.get("severity", "CRITICAL")  # MODERATE, HIGH, CRITICAL
    reason = payload.get("reason", "Precautionary safety closure")

    rooms_to_close = []
    if scope == "building" and target_building:
        b_rooms = db.query(Room).filter(
            (Room.building == target_building) | (Room.building.ilike(f"%{target_building}%"))
        ).all()
        if not b_rooms:
            # Try keyword fragments (e.g. 'INNOVATION-WORKSHOPS' -> 'workshop', 'innovation')
            parts = [p for p in target_building.replace("-", " ").replace("_", " ").split() if len(p) > 2]
            for p in parts:
                b_rooms = db.query(Room).filter(Room.building.ilike(f"%{p}%")).all()
                if b_rooms:
                    break
        rooms_to_close = [r.id for r in b_rooms]

        try:
            nav_col = get_navigation_collection()
            meta = nav_col.find_one({"type": "campus_metadata"})
            if meta:
                for r in meta.get("rooms", []):
                    b_id = r.get("building", "")
                    if b_id == target_building or target_building.lower() in b_id.lower() or b_id.lower() in target_building.lower():
                        rid = r.get("room_id")
                        if rid and rid not in rooms_to_close:
                            rooms_to_close.append(rid)
        except Exception:
            pass
    elif scope == "room" and target_rooms:
        rooms_to_close = target_rooms
    else:
        raise HTTPException(status_code=400, detail="Invalid closure scope: specify 'building' or list of 'rooms'.")

    # Identify impacted timetable sessions
    impacted_slots = db.query(TimetableSlot).filter(TimetableSlot.room_id.in_(rooms_to_close)).all()
    sessions_map = {s.id: s for s in db.query(SessionModel).all()}
    faculty_map = {f.id: f for f in db.query(Faculty).all()}

    affected_classes = []
    affected_cohorts = set()
    affected_faculty = set()

    for slot in impacted_slots:
        sess = sessions_map.get(slot.session_id)
        fac = faculty_map.get(sess.faculty_id) if sess else None
        if sess:
            for g in sess.groups:
                affected_cohorts.add(g)
            if fac:
                affected_faculty.add(f"{fac.name} ({fac.email if hasattr(fac, 'email') else fac.id})")

        affected_classes.append({
            "slot_id": slot.id,
            "session_id": slot.session_id,
            "course_id": sess.course_id if sess else slot.session_id,
            "day": slot.day,
            "start_period": slot.start_period,
            "closed_room_id": slot.room_id,
            "faculty": fac.name if fac else "Assigned Faculty",
            "groups": sess.groups if sess else []
        })

    # Identify impacted bookings
    impacted_bookings = db.query(BookingRequest).filter(
        BookingRequest.assigned_room.in_(rooms_to_close),
        BookingRequest.status.in_(["approved", "approve"])
    ).all()

    affected_events = []
    for b in impacted_bookings:
        affected_events.append({
            "booking_id": b.id,
            "title": b.title,
            "requester": b.requester,
            "assigned_room": b.assigned_room,
            "day": b.assigned_day,
            "periods": b.assigned_periods
        })

    incident_id = f"EMERG-{int(datetime.utcnow().timestamp())}"

    incident_doc = {
        "incident_id": incident_id,
        "title": hazard_title,
        "severity": severity,
        "reason": reason,
        "scope": scope,
        "closed_building": target_building if scope == "building" else None,
        "closed_rooms": rooms_to_close,
        "affected_classes_count": len(affected_classes),
        "affected_classes": affected_classes,
        "affected_events_count": len(affected_events),
        "affected_events": affected_events,
        "affected_cohorts": list(affected_cohorts),
        "affected_faculty": list(affected_faculty),
        "status": "active_lockdown",
        "contingency_status": "pending_generation",
        "authorized_by": current_user.email,
        "declared_at": datetime.utcnow().isoformat()
    }

    col = get_emergency_collection()
    col.insert_one(incident_doc)

    return {
        "status": "lockdown_declared",
        "incident_id": incident_id,
        "closed_rooms_count": len(rooms_to_close),
        "affected_classes_count": len(affected_classes),
        "affected_events_count": len(affected_events),
        "incident": incident_doc
    }


@router.post("/generate-contingency/{incident_id}")
def generate_emergency_contingency(
    incident_id: str,
    current_user: User = Depends(require_role(["admin", "department_coordinator"])),
    db: Session = Depends(get_db)
):
    """Generates alternative room allocations for displaced classes in safe unaffected venues."""
    col = get_emergency_collection()
    inc = col.find_one({"incident_id": incident_id})
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

    closed_rooms = set(inc.get("closed_rooms", []))
    all_rooms = db.query(Room).all()
    safe_rooms = [r for r in all_rooms if r.id not in closed_rooms]

    slots = db.query(TimetableSlot).all()
    occupied_slots = {(s.day, s.start_period, s.room_id) for s in slots}

    proposed_relocations = []
    unresolved_sessions = []

    for item in inc.get("affected_classes", []):
        day = item["day"]
        period = item["start_period"]
        sess_id = item["session_id"]
        sess = db.query(SessionModel).filter(SessionModel.id == sess_id).first()
        req_cap = sess.size if sess else 40
        req_types = sess.room_types if sess else ["classroom"]

        # Find safe room available at this exact day and period
        candidate = None
        for r in safe_rooms:
            # Check room type match
            if req_types and r.type not in req_types and r.type != "multipurpose":
                continue
            # Check capacity
            if r.capacity < req_cap:
                continue
            # Check occupied
            if (day, period, r.id) in occupied_slots:
                continue
            candidate = r
            break

        if candidate:
            occupied_slots.add((day, period, candidate.id))
            proposed_relocations.append({
                "session_id": sess_id,
                "course_id": item["course_id"],
                "day": day,
                "period": period,
                "original_room": item["closed_room_id"],
                "proposed_contingency_room": candidate.id,
                "contingency_room_name": candidate.name,
                "faculty": item["faculty"],
                "cohorts": item["groups"]
            })
        else:
            unresolved_sessions.append(sess_id)

    col.update_one(
        {"incident_id": incident_id},
        {"$set": {
            "contingency_status": "ready_for_approval",
            "proposed_relocations": proposed_relocations,
            "unresolved_sessions": unresolved_sessions,
            "contingency_generated_at": datetime.utcnow().isoformat()
        }}
    )

    return {
        "incident_id": incident_id,
        "contingency_status": "ready_for_approval",
        "successfully_relocated_count": len(proposed_relocations),
        "unresolved_count": len(unresolved_sessions),
        "proposed_relocations": proposed_relocations,
        "requires_authorized_approval": True
    }


@router.post("/approve-contingency/{incident_id}")
def approve_emergency_contingency(
    incident_id: str,
    payload: Dict[str, Any] = Body(...),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Commits and publishes the emergency contingency relocation after Admin authorization."""
    col = get_emergency_collection()
    inc = col.find_one({"incident_id": incident_id})
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

    relocations = inc.get("proposed_relocations", [])
    if not relocations:
        raise HTTPException(status_code=400, detail="No proposed relocations found to commit.")

    # Apply relocations to active timetable_slots
    applied_count = 0
    for rel in relocations:
        slot = db.query(TimetableSlot).filter(TimetableSlot.session_id == rel["session_id"]).first()
        if slot:
            slot.room_id = rel["proposed_contingency_room"]
            applied_count += 1

    # Record Audit Log
    audit = AuditLog(
        user_email=current_user.email,
        role=current_user.role,
        action="APPROVE_EMERGENCY_CONTINGENCY",
        target_type="emergency_incident",
        target_id=incident_id,
        details_json=f'{{"incident_id": "{incident_id}", "relocations_applied": {applied_count}}}'
    )
    db.add(audit)
    db.commit()

    col.update_one(
        {"incident_id": incident_id},
        {"$set": {
            "contingency_status": "published_live",
            "approved_by": current_user.email,
            "published_at": datetime.utcnow().isoformat()
        }}
    )

    return {
        "status": "success",
        "message": f"Contingency plan committed and published. {applied_count} classes relocated to safe venues.",
        "incident_id": incident_id,
        "published_by": current_user.email
    }
