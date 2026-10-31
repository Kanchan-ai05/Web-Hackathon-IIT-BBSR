import json
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey
from .database import Base

class CalendarSetting(Base):
    __tablename__ = "calendar_settings"
    id = Column(Integer, primary_key=True, autoincrement=True)
    dataset_id = Column(String(50), default="cit-public-v1")
    institute = Column(String(200), default="Chilika Institute of Technology")
    calendar_json = Column(Text, nullable=False)
    priority_order_json = Column(Text, nullable=False)
    role_category_cap_json = Column(Text, nullable=False)

class Room(Base):
    __tablename__ = "rooms"
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    building = Column(String(200), nullable=False)
    type = Column(String(50), nullable=False)
    capacity = Column(Integer, nullable=False)
    features_json = Column(Text, default="[]")
    accessible = Column(Boolean, default=False)
    allowed_uses_json = Column(Text, default="[]")

    @property
    def features(self):
        return json.loads(self.features_json or "[]")

    @property
    def allowed_uses(self):
        return json.loads(self.allowed_uses_json or "[]")

class RoomUnavailability(Base):
    __tablename__ = "room_unavailability"
    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(String(50), ForeignKey("rooms.id"), nullable=False)
    day = Column(String(10), nullable=False)
    periods_json = Column(Text, nullable=False)
    reason = Column(String(255), nullable=True)

    @property
    def periods(self):
        return json.loads(self.periods_json or "[]")

class Faculty(Base):
    __tablename__ = "faculty"
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    department = Column(String(50), nullable=False)
    max_hours_per_day = Column(Integer, default=4)
    needs_accessible = Column(Boolean, default=False)
    unavailable_json = Column(Text, default="[]")
    preferences_json = Column(Text, default="[]")

    @property
    def unavailable(self):
        return json.loads(self.unavailable_json or "[]")

    @property
    def preferences(self):
        return json.loads(self.preferences_json or "[]")

class StudentGroup(Base):
    __tablename__ = "student_groups"
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    year = Column(Integer, nullable=False)
    department = Column(String(50), nullable=False)
    size = Column(Integer, nullable=False)
    needs_accessible = Column(Boolean, default=False)

class Course(Base):
    __tablename__ = "courses"
    id = Column(String(50), primary_key=True)
    title = Column(String(150), nullable=False)
    department = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)
    lecture_hours = Column(Integer, default=0)
    tutorial_hours = Column(Integer, default=0)
    lab_blocks = Column(Integer, default=0)

class Session(Base):
    __tablename__ = "sessions"
    id = Column(String(100), primary_key=True)
    course_id = Column(String(50), ForeignKey("courses.id"), nullable=False)
    kind = Column(String(50), nullable=False)
    groups_json = Column(Text, nullable=False)
    faculty_id = Column(String(50), ForeignKey("faculty.id"), nullable=False)
    size = Column(Integer, nullable=False)
    duration = Column(Integer, default=1)
    room_types_json = Column(Text, default="[]")
    needs_accessible = Column(Boolean, default=False)
    basket_slot = Column(String(50), nullable=True)
    fixed_slot_json = Column(Text, nullable=True)

    @property
    def groups(self):
        return json.loads(self.groups_json or "[]")

    @property
    def room_types(self):
        return json.loads(self.room_types_json or "[]")

    @property
    def fixed_slot(self):
        return json.loads(self.fixed_slot_json) if self.fixed_slot_json else None

class BookingRequest(Base):
    __tablename__ = "booking_requests"
    id = Column(String(50), primary_key=True)
    submitted_at = Column(String(50), nullable=False)
    requester = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)
    department = Column(String(50), nullable=True)
    requested_category = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    attendance = Column(Integer, nullable=False)
    duration_periods = Column(Integer, nullable=False)
    windows_json = Column(Text, nullable=False)
    room_types_json = Column(Text, default="[]")
    needs_json = Column(Text, default="[]")
    requested_room = Column(String(50), nullable=True)
    mandatory_for_groups_json = Column(Text, default="[]")
    series_id = Column(String(50), nullable=True)
    raw_text = Column(Text, nullable=True)
    
    # Scheduling assignment
    status = Column(String(50), default="pending")  # approved, rejected, cancelled, pending
    assigned_day = Column(String(10), nullable=True)
    assigned_periods_json = Column(Text, default="[]")
    assigned_room = Column(String(50), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    @property
    def windows(self):
        return json.loads(self.windows_json or "[]")

    @property
    def room_types(self):
        return json.loads(self.room_types_json or "[]")

    @property
    def needs(self):
        return json.loads(self.needs_json or "[]")

    @property
    def mandatory_for_groups(self):
        return json.loads(self.mandatory_for_groups_json or "[]")

    @property
    def assigned_periods(self):
        return json.loads(self.assigned_periods_json or "[]")

class Cancellation(Base):
    __tablename__ = "cancellations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(String(50), ForeignKey("booking_requests.id"), nullable=False)
    cancelled_at = Column(String(50), nullable=False)
    by = Column(String(100), nullable=False)
    note = Column(Text, nullable=True)

class Exam(Base):
    __tablename__ = "exams"
    id = Column(String(50), primary_key=True)
    course_ids_json = Column(Text, nullable=False)
    groups_json = Column(Text, nullable=False)
    size = Column(Integer, nullable=False)
    duration_hours = Column(Integer, default=2)
    scheduled_day = Column(String(10), nullable=True)
    scheduled_session = Column(String(10), nullable=True)  # AM or PM
    scheduled_rooms_json = Column(Text, default="[]")

    @property
    def course_ids(self):
        return json.loads(self.course_ids_json or "[]")

    @property
    def groups(self):
        return json.loads(self.groups_json or "[]")

    @property
    def scheduled_rooms(self):
        return json.loads(self.scheduled_rooms_json or "[]")

class TimetableSlot(Base):
    __tablename__ = "timetable_slots"
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(100), ForeignKey("sessions.id"), nullable=False)
    day = Column(String(10), nullable=False)
    start_period = Column(Integer, nullable=False)
    room_id = Column(String(50), ForeignKey("rooms.id"), nullable=False)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(100), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)  # admin, department_coordinator, faculty, club
    department = Column(String(50), nullable=True)
    hashed_password = Column(String(255), nullable=False)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_email = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    target_type = Column(String(50), nullable=True)
    target_id = Column(String(100), nullable=True)
    details_json = Column(Text, default="{}")
    timestamp = Column(DateTime, default=datetime.utcnow)

    @property
    def details(self):
        return json.loads(self.details_json or "{}")
