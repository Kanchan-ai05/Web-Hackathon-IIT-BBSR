from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str
    name: str
    department: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    department: Optional[str] = None

class TimetableSlotSchema(BaseModel):
    session_id: str
    day: str
    start_period: int
    room_id: str

class BookingAllocationSchema(BaseModel):
    booking_id: str
    day: str
    periods: List[int]
    room_id: str
    status: str = "approved"

class ExamAllocationSchema(BaseModel):
    exam_id: str
    day: str
    session: str  # AM or PM
    rooms: List[str]

class ScheduleValidationRequest(BaseModel):
    timetable: Optional[List[TimetableSlotSchema]] = None
    bookings: Optional[List[BookingAllocationSchema]] = None
    exams: Optional[List[ExamAllocationSchema]] = None

class ViolationSchema(BaseModel):
    rule: str
    entities: List[str]
    slot: Dict[str, Any]

class ValidationResult(BaseModel):
    valid: bool
    violations: List[ViolationSchema]
    soft_penalty: int
    soft_breakdown: Dict[str, int]
    stats: Optional[Dict[str, Any]] = None

class ManualBookingCreate(BaseModel):
    requester: str
    role: str
    department: Optional[str] = None
    requested_category: str
    title: str
    attendance: int
    duration_periods: int
    day: str
    periods: List[int]
    room_id: str
    needs: Optional[List[str]] = Field(default_factory=list)
    mandatory_for_groups: Optional[List[str]] = Field(default_factory=list)
    raw_text: Optional[str] = None

class AuditLogResponse(BaseModel):
    id: int
    user_email: str
    role: str
    action: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    details: Dict[str, Any]
    timestamp: str
