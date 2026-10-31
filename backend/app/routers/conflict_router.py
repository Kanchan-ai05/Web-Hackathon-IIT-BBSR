"""FastAPI Router for Intelligent Conflict Monitoring & Predictive Risk Assessment.
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
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
from ..auth import get_current_user, User
from backend.conflict_monitor import CITConflictMonitor
from .timetable_router import _build_dataset_dict

router = APIRouter(prefix="/api/conflicts", tags=["Conflict Monitoring"])

def _get_monitor(db: Session) -> CITConflictMonitor:
    """Instantiates CITConflictMonitor with live database state."""
    dataset = _build_dataset_dict(db)

    # Fetch current timetable slots
    slots = [
        {
            "session_id": s.session_id,
            "day": s.day,
            "start_period": s.start_period,
            "room_id": s.room_id
        }
        for s in db.query(TimetableSlot).all()
    ]

    # Fetch all booking requests
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
            "status": b.status,
            "assigned_day": b.assigned_day,
            "assigned_periods": b.assigned_periods,
            "assigned_room": b.assigned_room,
            "rejection_reason": b.rejection_reason
        }
        for b in db.query(BookingRequest).all()
    ]

    # Fetch exams
    exams = [
        {
            "id": e.id,
            "course_ids": e.course_ids,
            "groups": e.groups,
            "size": e.size,
            "duration_hours": e.duration_hours,
            "scheduled_day": e.scheduled_day,
            "scheduled_session": e.scheduled_session,
            "scheduled_rooms": e.scheduled_rooms
        }
        for e in db.query(Exam).all()
    ]

    return CITConflictMonitor(dataset, slots, bookings, exams)

@router.get("/summary")
def get_conflict_summary(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Provides high-level conflict status, risk distributions, and alerts."""
    monitor = _get_monitor(db)
    conflicts = monitor.detect_all_conflicts()
    room_risks = monitor.calculate_room_risk_scores()
    booking_risks = monitor.detect_predictive_booking_risks()

    severity_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    for c in conflicts:
        sev = c.get("severity", "Medium")
        severity_counts[sev] = severity_counts.get(sev, 0) + 1

    high_demand_rooms = [r for r in room_risks if r["demand_level"] == "High Demand"]
    critical_rooms = [r for r in room_risks if r["risk_level"] == "Critical"]
    overbooking_warnings = [b for b in booking_risks if b["status"] == "pending" and (b["has_collision"] or b["competing_requests"])]

    avg_room_risk = round(sum(r["risk_score"] for r in room_risks) / len(room_risks), 1) if room_risks else 0

    return {
        "status": "healthy" if len(conflicts) == 0 else "action_required",
        "total_active_conflicts": len(conflicts),
        "severity_breakdown": severity_counts,
        "high_demand_rooms_count": len(high_demand_rooms),
        "critical_rooms_count": len(critical_rooms),
        "overbooking_warnings_count": len(overbooking_warnings),
        "average_room_risk_score": avg_room_risk,
        "top_congested_rooms": room_risks[:5]
    }

@router.get("/details")
def get_conflict_details(
    severity: Optional[str] = Query(None, description="Filter by severity (Critical, High, Medium, Low)"),
    type: Optional[str] = Query(None, description="Filter by conflict type"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Lists granular detected conflicts with reasons and concrete recommendations."""
    monitor = _get_monitor(db)
    conflicts = monitor.detect_all_conflicts()

    if severity:
        conflicts = [c for c in conflicts if c.get("severity", "").lower() == severity.lower()]
    if type:
        conflicts = [c for c in conflicts if c.get("type", "").lower() == type.lower()]

    return {
        "count": len(conflicts),
        "conflicts": conflicts
    }

@router.get("/room-risks")
def get_room_risk_scores(
    level: Optional[str] = Query(None, description="Filter by risk level (Critical, High, Medium, Low)"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Returns deterministic room risk scores and demand indicators."""
    monitor = _get_monitor(db)
    risks = monitor.calculate_room_risk_scores()

    if level:
        risks = [r for r in risks if r["risk_level"].lower() == level.lower()]

    return {
        "count": len(risks),
        "rooms": risks
    }

@router.get("/booking-risks")
def get_booking_risks(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (pending, approved)"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Predictive booking risk assessment detecting overbooking before approval."""
    monitor = _get_monitor(db)
    risks = monitor.detect_predictive_booking_risks()

    if status_filter:
        risks = [b for b in risks if b["status"].lower() == status_filter.lower()]

    return {
        "count": len(risks),
        "bookings": risks
    }
