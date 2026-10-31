import os
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Header, Depends, Body, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, TimetableSlot, Room, Course, Session as SessionModel
from ..auth import get_current_user
from backend.nlp_service import (
    test_llm_key,
    parse_booking_prompt,
    ask_timetable_assistant,
    explain_decision
)

router = APIRouter(prefix="/api/ai", tags=["AI & LLM Services"])

@router.post("/test-key")
def verify_api_key(
    api_key: str = Body(..., embed=True),
    provider: str = Body("gemini", embed=True),
    current_user: User = Depends(get_current_user)
):
    """Verifies whether a user-provided LLM API key (Google Gemini or OpenAI) is active."""
    return test_llm_key(api_key=api_key, provider=provider)

@router.post("/parse-booking")
def parse_booking_with_llm(
    text: str = Body(..., embed=True),
    provider: Optional[str] = Body("gemini", embed=True),
    x_gemini_key: Optional[str] = Header(None, alias="X-Gemini-Key"),
    x_openai_key: Optional[str] = Header(None, alias="X-OpenAI-Key"),
    api_key_override: Optional[str] = Body(None, embed=True),
    current_user: User = Depends(get_current_user)
):
    """Parses natural language booking prompt using live LLM or deterministic fallback.
    
    Locks role and event category to authenticated user account (anti-bypass).
    """
    key = api_key_override or x_gemini_key or x_openai_key
    selected_provider = "openai" if x_openai_key else provider

    return parse_booking_prompt(
        text=text,
        user_role=current_user.role,
        user_department=current_user.department,
        api_key=key,
        provider=selected_provider
    )

@router.post("/ask-timetable")
def ask_timetable(
    query: str = Body(..., embed=True),
    provider: Optional[str] = Body("gemini", embed=True),
    x_gemini_key: Optional[str] = Header(None, alias="X-Gemini-Key"),
    x_openai_key: Optional[str] = Header(None, alias="X-OpenAI-Key"),
    api_key_override: Optional[str] = Body(None, embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Answers natural language queries about schedule, room availability, and faculty loads."""
    slots = db.query(TimetableSlot).all()
    rooms = db.query(Room).all()
    sessions = db.query(SessionModel).all()

    context = {
        "sessions": [{"id": s.id, "course_id": s.course_id} for s in sessions],
        "rooms": [{"id": r.id, "name": r.name, "type": r.type, "capacity": r.capacity} for r in rooms],
        "sample_slots": [
            {"session_id": s.session_id, "day": s.day, "start_period": s.start_period, "room_id": s.room_id}
            for s in slots[:20]
        ]
    }

    key = api_key_override or x_gemini_key or x_openai_key
    selected_provider = "openai" if x_openai_key else provider

    return ask_timetable_assistant(
        query=query,
        schedule_context=context,
        api_key=key,
        provider=selected_provider
    )
