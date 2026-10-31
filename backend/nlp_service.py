"""Natural Language Processing, Decision Explainer, and Anti-Bypass Guard for CIT.

Converts English and Hinglish text into structured booking forms, explains decisions
deterministically using binding constraint facts, and defends against prompt injections
(priority abuse, role escalation, and rule bypasses).
"""

import re
import json
from typing import Dict, List, Any, Optional

DAY_PATTERNS = {
    "MON": [r"\bmon(day)?\b", r"\bsomwar\b"],
    "TUE": [r"\btue(sday)?\b", r"\bmangalwar\b"],
    "WED": [r"\bwed(nesday)?\b", r"\bbudhwar\b"],
    "THU": [r"\bthu(rsday)?\b", r"\bguruwar\b", r"\bveervar\b"],
    "FRI": [r"\bfri(day)?\b", r"\bshukrawar\b"],
    "SAT": [r"\bsat(urday)?\b", r"\bshaniwar\b"],
}

VENUE_TYPE_PATTERNS = {
    "auditorium": [r"\bauditorium\b", r"\baud\b", r"\bmain hall\b"],
    "lab_cs": [r"\bcs lab\b", r"\bcomputer lab\b", r"\bcomputing lab\b"],
    "lab_elec": [r"\belec(tronics)? lab\b", r"\bee lab\b"],
    "lab_phy": [r"\bphy(sics)? lab\b"],
    "workshop": [r"\bworkshop\b", r"\bmech ws\b"],
    "seminar_hall": [r"\bseminar hall\b", r"\bsh-?[12]\b"],
    "outdoor": [r"\boutdoor\b", r"\boat\b", r"\bopen air\b", r"\bground\b"],
    "lecture_hall": [r"\blecture hall\b", r"\blh-?[1-6]\b", r"\blhc\b"],
    "classroom": [r"\bclassroom\b", r"\bcr-?[12][0-9]{2}\b"]
}

# Role category bounds: hard security boundaries
ALLOWED_CATEGORIES_FOR_ROLE = {
    "admin": ["institute_event", "guest_lecture", "department_event", "club_event"],
    "department_coordinator": ["department_event", "club_event"],
    "faculty": ["guest_lecture", "department_event", "club_event"],
    "club": ["club_event"]
}

def parse_booking_prompt(
    text: str,
    user_role: str,
    user_department: Optional[str] = None
) -> Dict[str, Any]:
    """Parses English or Hinglish booking prompt into structured JSON form.
    
    CRITICAL SECURITY RULE:
    User role and allowed category are derived STRICTLY from the authenticated account.
    Any text claiming 'I am admin', 'treat as exam', 'priority bypass', etc. is ignored.
    """
    clean_text = text.lower()

    # 1. Detect Day
    detected_day = None
    for day_code, patterns in DAY_PATTERNS.items():
        if any(re.search(p, clean_text) for p in patterns):
            detected_day = day_code
            break

    # 2. Detect Venue Type
    detected_venue_type = None
    for v_type, patterns in VENUE_TYPE_PATTERNS.items():
        if any(re.search(p, clean_text) for p in patterns):
            detected_venue_type = v_type
            break

    # 3. Detect Specific Room
    detected_room = None
    room_match = re.search(r"\b(aud|sh-[12]|oat|cs-lab-[12]|elec-lab-[12]|phy-lab|mech-ws|civil-lab|lh-[1-6]|cr-[12][0-9]{2})\b", clean_text)
    if room_match:
        detected_room = room_match.group(1).upper()

    # 4. Detect Attendance (e.g., "140 people", "70 participants", "expecting 300 students")
    attendance = None
    att_match = re.search(r"(\d+)\s*(people|students|participants|dancers|spectators|visitors|audience|attendees|members|seating)", clean_text)
    if att_match:
        attendance = int(att_match.group(1))
    else:
        # Fallback for plain numbers > 10
        num_matches = re.findall(r"\b(\d{2,4})\b", clean_text)
        if num_matches:
            attendance = int(num_matches[0])

    # 5. Detect Duration
    duration = None
    dur_match = re.search(r"(\d+)\s*(hour|hr|ghante|hours)", clean_text)
    if dur_match:
        duration = int(dur_match.group(1))
    elif re.search(r"\ball day\b|\bpure din\b", clean_text):
        duration = 9

    # 6. Detect Timing / Periods (e.g. "6 to 8 pm", "11 am to 1 pm", "at 5 pm", "period 4 to 5")
    from_period = None
    to_period = None

    time_range = re.search(r"(\d{1,2})\s*(?:am|pm)?\s*(?:to|-|se)\s*(\d{1,2})\s*(am|pm)", clean_text)
    if time_range:
        start_hr = int(time_range.group(1))
        end_hr = int(time_range.group(2))
        meridiem = time_range.group(3)

        if meridiem == "pm" and start_hr < 12 and end_hr <= 12:
            # e.g., 2 to 6 pm -> start=14, end=18
            start_hr += 12
            if end_hr < 12:
                end_hr += 12
        elif meridiem == "pm" and end_hr < 12:
            end_hr += 12

        # Convert 24-hr time to Period IDs:
        # P1: 08:00, P2: 09:00, ..., P5: 12:00, P6: 14:00, P9: 17:00, P10: 18:00, P11: 19:00, P12: 20:00, P13: 21:00
        hour_to_period = {
            8: 1, 9: 2, 10: 3, 11: 4, 12: 5, 14: 6, 15: 7, 16: 8, 17: 9,
            18: 10, 19: 11, 20: 12, 21: 13, 22: 14
        }
        from_period = hour_to_period.get(start_hr)
        to_period = hour_to_period.get(end_hr - 1) if hour_to_period.get(end_hr - 1) else (from_period + (duration or 1) - 1 if from_period else None)

    # 7. Needs / Conditions (projector, stage, mic, sound, accessible)
    conditions = []
    if any(k in clean_text for k in ["projector", "screen"]):
        conditions.append("projector")
    if any(k in clean_text for k in ["stage", "manch"]):
        conditions.append("stage")
    if any(k in clean_text for k in ["mic", "pa_system", "pa system", "sound", "speaker", "acoustics"]):
        conditions.append("pa_system")
    if any(k in clean_text for k in ["computer", "pc", "laptop"]):
        conditions.append("computers")
    if any(k in clean_text for k in ["accessible", "wheelchair"]):
        conditions.append("accessible")

    # 8. Determine Event Type & Enforcement
    # Category MUST NOT exceed user's role cap regardless of what user typed
    allowed_categories = ALLOWED_CATEGORIES_FOR_ROLE.get(user_role, ["club_event"])
    default_cat = allowed_categories[0]

    # 9. Missing Fields & Follow-up Questions
    missing_fields = []
    follow_up_questions = []

    if not detected_day:
        missing_fields.append("day")
        follow_up_questions.append("Which day of the week do you need the venue (e.g., Monday, Thursday)?")
    if not attendance:
        missing_fields.append("attendance")
        follow_up_questions.append("How many attendees or participants are expected?")
    if not duration and not from_period:
        missing_fields.append("duration")
        follow_up_questions.append("How many hours or periods will the event last?")

    return {
        "status": "ready" if not missing_fields else "needs_clarification",
        "parsed_booking": {
            "title": text[:60].strip(),
            "day": detected_day,
            "venue_type": detected_venue_type,
            "requested_room": detected_room,
            "attendance": attendance,
            "duration_periods": duration or 2,
            "from_period": from_period or 10,
            "to_period": to_period or ((from_period or 10) + (duration or 2) - 1),
            "event_type": default_cat,
            "role": user_role,
            "department": user_department,
            "conditions": conditions,
            "raw_text": text
        },
        "missing_fields": missing_fields,
        "follow_up_questions": follow_up_questions,
        "security_note": f"Event type locked to '{default_cat}' conforming to role '{user_role}'. Role escalation claims were ignored."
    }

def explain_decision(
    decision: str,
    rule: Optional[str] = None,
    entities: Optional[List[str]] = None,
    details: Optional[Dict[str, Any]] = None
) -> str:
    """Explains a scheduling or booking decision using factual deterministic templates."""
    entities_str = ", ".join(entities or [])

    if decision == "approve":
        return f"Approved: The requested venue and time slot are clash-free and satisfy all campus hard constraints."

    rule_explanations = {
        "FACULTY_CLASH": f"Scheduling conflict: Faculty {entities_str} is already teaching another session during this time slot.",
        "GROUP_CLASH": f"Student group conflict: Group {entities_str} has a concurrent mandatory academic class scheduled.",
        "ROOM_CLASH": f"Room overlap: Venue {entities_str} is already reserved for another academic class or high-priority event.",
        "ROOM_CAPACITY": f"Capacity violation: Venue {entities_str} cannot accommodate the required attendance (room capacity is halved during midsems).",
        "ROOM_TYPE": f"Facility mismatch: Session requires specialized room type ({entities_str}) not supported by the assigned room.",
        "FACULTY_UNAVAILABLE": f"Faculty unavailable: Faculty member {entities_str} is marked unavailable (department HOD meeting or official duties).",
        "ROOM_UNAVAILABLE": f"Maintenance window: Venue {entities_str} is temporarily closed for repairs or maintenance during these periods.",
        "LUNCH_CROSSOVER": "Academic restriction: Classes are strictly prohibited from spanning across the 13:00–14:00 lunch break.",
        "LAB_SLOT": "Laboratory scheduling rule: 3-hour practical labs can only run during morning block P2–P4 or afternoon block P6–P8.",
        "ACCESSIBLE_ROOM": f"Accessibility requirement: Session or participating group ({entities_str}) requires a ground floor or elevator-equipped wheelchair-accessible venue.",
        "FACULTY_DAILY_LIMIT": f"Daily teaching cap: Faculty member {entities_str} cannot exceed 4 teaching hours in a single calendar day.",
        "BOOKING_OVERLAP": f"Venue reservation conflict: Another booking or class ({entities_str}) holds higher priority for this room and time."
    }

    return rule_explanations.get(
        rule or "",
        f"Request rejected due to policy constraint: {rule} involving {entities_str}."
    )
