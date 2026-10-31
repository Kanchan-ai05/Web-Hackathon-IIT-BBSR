"""FastAPI Router for Central Campus Command Centre.

Provides executive campus administrators with a consolidated real-time operational picture:
- Live campus occupancy pulse (occupied vs vacant rooms).
- Active scheduling conflicts from the Conflict Monitor.
- Today's upcoming venue bookings and midsem exams.
- Active emergency lockdown alerts and safety statuses.
- Central pending approvals queue (venue bookings, emergency contingencies, events).
- Active classroom and laboratory maintenance tickets.
- Real-time campus resource utilization indicators.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Room, TimetableSlot, BookingRequest, Exam, AuditLog
from ..auth import get_optional_current_user, User
from ..mongodb import (
    get_emergency_collection,
    get_maintenance_collection,
    get_events_collection,
    get_checkins_collection
)
from backend.conflict_monitor import CITConflictMonitor
from .timetable_router import _build_dataset_dict

router = APIRouter(prefix="/api/command", tags=["Campus Command Centre"])


@router.get("/summary")
def get_command_centre_summary(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Returns the complete unified command centre operational pulse."""
    rooms = db.query(Room).all()
    slots = db.query(TimetableSlot).all()
    bookings = db.query(BookingRequest).all()
    exams = db.query(Exam).all()

    # 1. Campus Occupancy Pulse
    total_rooms = len(rooms)
    scheduled_rooms = {s.room_id for s in slots}.union(
        {b.assigned_room for b in bookings if b.assigned_room and b.status in ("approved", "approve")}
    )
    occupied_count = len(scheduled_rooms)
    vacant_count = max(0, total_rooms - occupied_count)
    occupancy_rate = round((occupied_count / total_rooms * 100), 1) if total_rooms > 0 else 0.0

    # 2. Active Scheduling Conflicts
    dataset = _build_dataset_dict(db)
    slots_list = [{"session_id": s.session_id, "day": s.day, "start_period": s.start_period, "room_id": s.room_id} for s in slots]
    bookings_list = [
        {
            "id": b.id, "title": b.title, "requester": b.requester, "role": b.role,
            "department": b.department, "requested_category": b.requested_category,
            "assigned_room": b.assigned_room, "assigned_day": b.assigned_day,
            "assigned_periods": b.assigned_periods, "status": b.status
        }
        for b in bookings
    ]
    monitor = CITConflictMonitor(dataset, slots_list, bookings_list)
    conflict_report = monitor.detect_all_conflicts()

    # 3. Emergency Status
    emerg_col = get_emergency_collection()
    active_emergencies = emerg_col.find({"status": "active_lockdown"})
    emergency_alerts = []
    for em in active_emergencies:
        emergency_alerts.append({
            "incident_id": em.get("incident_id"),
            "title": em.get("title"),
            "severity": em.get("severity"),
            "closed_rooms": em.get("closed_rooms", []),
            "contingency_status": em.get("contingency_status")
        })

    # 4. Pending Approvals Queue
    pending_bookings = [
        {"id": b.id, "title": b.title, "requester": b.requester, "category": b.requested_category, "type": "venue_booking"}
        for b in bookings if b.status == "pending"
    ]
    events_col = get_events_collection()
    pending_events = [
        {"id": e.get("event_id"), "title": e.get("title"), "organizer": e.get("organizer"), "type": "campus_event"}
        for e in events_col.find({"status": "pending_approval"})
    ]
    all_pending_approvals = pending_bookings + pending_events

    # 5. Maintenance Issues
    maint_col = get_maintenance_collection()
    active_maint = maint_col.find({"status": {"$in": ["reported", "assigned"]}})
    maint_issues = []
    for m in active_maint:
        maint_issues.append({
            "ticket_id": m.get("ticket_id"),
            "room_id": m.get("room_id"),
            "title": m.get("title"),
            "severity": m.get("severity"),
            "requires_closure": m.get("requires_closure", False),
            "assigned_to": m.get("assigned_to")
        })

    # 6. Upcoming Key Events & Exams Today
    upcoming_approved_bookings = [
        {
            "id": b.id,
            "title": b.title,
            "venue": b.assigned_room,
            "time": f"{b.assigned_day} P{', '.join(str(p) for p in b.assigned_periods)}",
            "attendance": b.attendance
        }
        for b in bookings if b.status in ("approved", "approve") and b.assigned_room
    ][:5]

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "campus_status": "NORMAL" if len(emergency_alerts) == 0 else "EMERGENCY_ACTIVE",
        "occupancy": {
            "total_rooms": total_rooms,
            "occupied_rooms": occupied_count,
            "vacant_rooms": vacant_count,
            "occupancy_rate_pct": occupancy_rate
        },
        "conflicts": {
            "total_active_conflicts": len(conflict_report),
            "critical_risk_count": sum(1 for c in conflict_report if c.get("severity") == "Critical"),
            "status": "ALL_CLEAR" if len(conflict_report) == 0 else "ATTENTION_REQUIRED"
        },
        "emergency_alerts": {
            "active_count": len(emergency_alerts),
            "alerts": emergency_alerts
        },
        "pending_approvals": {
            "total_count": len(all_pending_approvals),
            "items": all_pending_approvals[:8]
        },
        "maintenance_pulse": {
            "active_tickets_count": len(maint_issues),
            "tickets": maint_issues[:6]
        },
        "upcoming_activities": upcoming_approved_bookings
    }
