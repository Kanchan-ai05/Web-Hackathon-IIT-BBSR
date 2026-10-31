"""FastAPI Router for Campus Intelligence Analytics & Reports.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import (
    Room,
    Faculty,
    StudentGroup,
    Course,
    Session as SessionModel,
    TimetableSlot,
    BookingRequest,
    Exam
)
from ..auth import get_optional_current_user, User
from backend.analytics_service import CITAnalyticsService
from .timetable_router import _build_dataset_dict

router = APIRouter(prefix="/api/analytics", tags=["Campus Intelligence Analytics"])

def _get_analytics_service(db: Session) -> CITAnalyticsService:
    dataset = _build_dataset_dict(db)
    slots = [
        {
            "session_id": s.session_id,
            "day": s.day,
            "start_period": s.start_period,
            "room_id": s.room_id
        }
        for s in db.query(TimetableSlot).all()
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
            "status": b.status,
            "assigned_day": b.assigned_day,
            "assigned_periods": b.assigned_periods,
            "assigned_room": b.assigned_room
        }
        for b in db.query(BookingRequest).all()
    ]
    return CITAnalyticsService(dataset, slots, bookings)

@router.get("/overview")
def get_campus_overview(
    department: Optional[str] = Query(None, description="Filter by department (e.g. CSE, ECE, ME, CE)"),
    day: Optional[str] = Query(None, description="Filter by day of week (MON, TUE, WED, THU, FRI)"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Returns comprehensive institutional metrics across rooms, faculty workload, and bookings."""
    service = _get_analytics_service(db)
    return service.get_full_analytics(department_filter=department, day_filter=day)

@router.get("/export/csv")
def export_csv_report(
    report_type: str = Query("rooms", description="Report type: rooms, faculty, bookings, or summary"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Generates and downloads real-time CSV report."""
    service = _get_analytics_service(db)
    csv_data = service.generate_csv_report(report_type)

    filename = f"cit_{report_type}_report.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
