try:
    from ..validator import (
        CITValidator,
        validate_schedule,
        RULE_EVERY_SESSION_SCHEDULED,
        RULE_FACULTY_CLASH,
        RULE_GROUP_CLASH,
        RULE_ROOM_CLASH,
        RULE_ROOM_CAPACITY,
        RULE_ROOM_TYPE,
        RULE_FACULTY_UNAVAILABLE,
        RULE_ROOM_UNAVAILABLE,
        RULE_LUNCH_CROSSOVER,
        RULE_LAB_SLOT,
        RULE_ACCESSIBLE_ROOM,
        RULE_ELECTIVE_BASKET,
        RULE_FACULTY_DAILY_LIMIT,
        RULE_FIXED_SLOT,
        RULE_BOOKING_OVERLAP,
    )
except (ImportError, ValueError):
    import sys
    import os
    # Add parent dir to sys.path if not present
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)
    from validator import (
        CITValidator,
        validate_schedule,
        RULE_EVERY_SESSION_SCHEDULED,
        RULE_FACULTY_CLASH,
        RULE_GROUP_CLASH,
        RULE_ROOM_CLASH,
        RULE_ROOM_CAPACITY,
        RULE_ROOM_TYPE,
        RULE_FACULTY_UNAVAILABLE,
        RULE_ROOM_UNAVAILABLE,
        RULE_LUNCH_CROSSOVER,
        RULE_LAB_SLOT,
        RULE_ACCESSIBLE_ROOM,
        RULE_ELECTIVE_BASKET,
        RULE_FACULTY_DAILY_LIMIT,
        RULE_FIXED_SLOT,
        RULE_BOOKING_OVERLAP,
    )
