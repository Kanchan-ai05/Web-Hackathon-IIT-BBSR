"""Database Loader for Chilika Institute of Technology (CIT).

Loads cit_public.json into SQLite tables and seeds the 4 role-based demo accounts.
"""

import json
import os
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from .database import engine, SessionLocal, Base
from .models import (
    CalendarSetting,
    Room,
    RoomUnavailability,
    Faculty,
    StudentGroup,
    Course,
    Session as SessionModel,
    BookingRequest,
    Cancellation,
    Exam,
    TimetableSlot,
    User,
    AuditLog
)
from .auth import get_password_hash
from .config import settings

DEMO_ACCOUNTS = [
    {
        "email": "admin@cit.edu",
        "name": "Prof. Shreya Kapoor (Dean's Office)",
        "role": "admin",
        "department": "ADMIN",
        "password": "Admin@123"
    },
    {
        "email": "coordinator@cit.edu",
        "name": "Dr. Ananya Mishra (CSE Coordinator)",
        "role": "department_coordinator",
        "department": "CSE",
        "password": "Coord@123"
    },
    {
        "email": "faculty@cit.edu",
        "name": "Dr. Rohit Sahoo",
        "role": "faculty",
        "department": "CSE",
        "password": "Faculty@123"
    },
    {
        "email": "club@cit.edu",
        "name": "Spectra Core Team Rep",
        "role": "club",
        "department": None,
        "password": "Club@123"
    }
]

def load_cit_dataset(db: Session, data: Dict[str, Any], reseed_users: bool = True) -> Dict[str, int]:
    """Load CIT dataset dictionary into database tables."""
    # Ensure all tables exist
    Base.metadata.create_all(bind=engine)

    # Clear existing schedule tables
    db.query(TimetableSlot).delete()
    db.query(Cancellation).delete()
    db.query(BookingRequest).delete()
    db.query(Exam).delete()
    db.query(SessionModel).delete()
    db.query(Course).delete()
    db.query(StudentGroup).delete()
    db.query(Faculty).delete()
    db.query(RoomUnavailability).delete()
    db.query(Room).delete()
    db.query(CalendarSetting).delete()
    db.commit()

    # 1. Calendar Settings
    cal = CalendarSetting(
        dataset_id=data.get("dataset_id", "cit-public-v1"),
        institute=data.get("institute", "Chilika Institute of Technology"),
        calendar_json=json.dumps(data.get("calendar", {})),
        priority_order_json=json.dumps(data.get("priority_order", [])),
        role_category_cap_json=json.dumps(data.get("role_category_cap", {}))
    )
    db.add(cal)

    # 2. Rooms
    rooms_count = 0
    for r in data.get("rooms", []):
        room = Room(
            id=r["id"],
            name=r["name"],
            building=r["building"],
            type=r["type"],
            capacity=r["capacity"],
            features_json=json.dumps(r.get("features", [])),
            accessible=r.get("accessible", False),
            allowed_uses_json=json.dumps(r.get("allowed_uses", []))
        )
        db.add(room)
        rooms_count += 1

    # 3. Room Unavailability
    room_unavail_count = 0
    for ru in data.get("room_unavailability", []):
        unavail = RoomUnavailability(
            room_id=ru["room_id"],
            day=ru["day"],
            periods_json=json.dumps(ru.get("periods", [])),
            reason=ru.get("reason", "")
        )
        db.add(unavail)
        room_unavail_count += 1

    # 4. Faculty
    faculty_count = 0
    for f in data.get("faculty", []):
        fac = Faculty(
            id=f["id"],
            name=f["name"],
            department=f["department"],
            max_hours_per_day=f.get("max_hours_per_day", 4),
            needs_accessible=f.get("needs_accessible", False),
            unavailable_json=json.dumps(f.get("unavailable", [])),
            preferences_json=json.dumps(f.get("preferences", []))
        )
        db.add(fac)
        faculty_count += 1

    # 5. Student Groups
    groups_count = 0
    for g in data.get("student_groups", []):
        grp = StudentGroup(
            id=g["id"],
            name=g["name"],
            year=g["year"],
            department=g["department"],
            size=g["size"],
            needs_accessible=g.get("needs_accessible", False)
        )
        db.add(grp)
        groups_count += 1

    # 6. Courses
    courses_count = 0
    for c in data.get("courses", []):
        course = Course(
            id=c["id"],
            title=c["title"],
            department=c["department"],
            year=c["year"],
            lecture_hours=c.get("lecture_hours", 0),
            tutorial_hours=c.get("tutorial_hours", 0),
            lab_blocks=c.get("lab_blocks", 0)
        )
        db.add(course)
        courses_count += 1

    # 7. Sessions
    sessions_count = 0
    for s in data.get("sessions", []):
        sess = SessionModel(
            id=s["id"],
            course_id=s["course_id"],
            kind=s["kind"],
            groups_json=json.dumps(s.get("groups", [])),
            faculty_id=s["faculty_id"],
            size=s["size"],
            duration=s.get("duration", 1),
            room_types_json=json.dumps(s.get("room_types", [])),
            needs_accessible=s.get("needs_accessible", False),
            basket_slot=s.get("basket_slot"),
            fixed_slot_json=json.dumps(s.get("fixed_slot")) if s.get("fixed_slot") else None
        )
        db.add(sess)
        sessions_count += 1

    # 8. Booking Requests
    bookings_count = 0
    for b in data.get("booking_requests", []):
        bk = BookingRequest(
            id=b["id"],
            submitted_at=b["submitted_at"],
            requester=b["requester"],
            role=b["role"],
            department=b.get("department"),
            requested_category=b["requested_category"],
            title=b["title"],
            attendance=b["attendance"],
            duration_periods=b["duration_periods"],
            windows_json=json.dumps(b.get("windows", [])),
            room_types_json=json.dumps(b.get("room_types", [])),
            needs_json=json.dumps(b.get("needs", [])),
            requested_room=b.get("requested_room"),
            mandatory_for_groups_json=json.dumps(b.get("mandatory_for_groups", [])),
            series_id=b.get("series_id"),
            raw_text=b.get("raw_text"),
            status="pending"
        )
        db.add(bk)
        bookings_count += 1

    db.flush()

    # 9. Cancellations
    cancellations_count = 0
    for cn in data.get("cancellations", []):
        canc = Cancellation(
            request_id=cn["request_id"],
            cancelled_at=cn["cancelled_at"],
            by=cn["by"],
            note=cn.get("note", "")
        )
        db.add(canc)
        # Update matching booking status to cancelled
        bk_match = db.query(BookingRequest).filter(BookingRequest.id == cn["request_id"]).first()
        if bk_match:
            bk_match.status = "cancelled"
            bk_match.rejection_reason = f"Cancelled by {cn['by']}: {cn.get('note', '')}"
        cancellations_count += 1

    # 10. Exams
    exams_count = 0
    for ex in data.get("exams", []):
        exam = Exam(
            id=ex["id"],
            course_ids_json=json.dumps(ex.get("course_ids", [])),
            groups_json=json.dumps(ex.get("groups", [])),
            size=ex["size"],
            duration_hours=ex.get("duration_hours", 2)
        )
        db.add(exam)
        exams_count += 1

    # 11. Demo Users
    if reseed_users:
        db.query(User).delete()
        for u in DEMO_ACCOUNTS:
            user = User(
                email=u["email"],
                name=u["name"],
                role=u["role"],
                department=u.get("department"),
                hashed_password=get_password_hash(u["password"])
            )
            db.add(user)

    # 12. Record Audit Log Entry
    audit = AuditLog(
        user_email="system@cit.edu",
        role="admin",
        action="DATASET_LOAD",
        target_type="dataset",
        target_id=data.get("dataset_id", "cit-public-v1"),
        details_json=json.dumps({
            "rooms": rooms_count,
            "faculty": faculty_count,
            "groups": groups_count,
            "sessions": sessions_count,
            "bookings": bookings_count,
            "exams": exams_count
        })
    )
    db.add(audit)
    db.commit()

    return {
        "rooms": rooms_count,
        "room_unavailability": room_unavail_count,
        "faculty": faculty_count,
        "student_groups": groups_count,
        "courses": courses_count,
        "sessions": sessions_count,
        "booking_requests": bookings_count,
        "cancellations": cancellations_count,
        "exams": exams_count
    }

def init_db(data_filepath: Optional[str] = None) -> Dict[str, int]:
    """Initialize database and load dataset from disk."""
    path = data_filepath or settings.DATA_PATH
    if not os.path.exists(path):
        # Fallback to local data/cit_public.json
        alt_path = os.path.join(os.getcwd(), "data", "cit_public.json")
        if os.path.exists(alt_path):
            path = alt_path
        else:
            raise FileNotFoundError(f"CIT dataset not found at {path} or {alt_path}")

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    db = SessionLocal()
    try:
        counts = load_cit_dataset(db, data)
        return counts
    finally:
        db.close()

if __name__ == "__main__":
    print("Seeding CIT Database...")
    result = init_db()
    print("Database Initialized Successfully:")
    for k, v in result.items():
        print(f"  - {k}: {v}")
