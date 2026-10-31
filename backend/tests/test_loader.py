import json
import pytest
from backend.app.models import (
    Room,
    Faculty,
    StudentGroup,
    Session as SessionModel,
    BookingRequest,
    Exam,
    User,
    AuditLog
)
from backend.app.loader import load_cit_dataset
from backend.app.auth import create_access_token

def test_database_counts(db_session):
    assert db_session.query(Room).count() == 27, "Must load exactly 27 rooms"
    assert db_session.query(Faculty).count() == 40, "Must load exactly 40 faculty"
    assert db_session.query(StudentGroup).count() == 14, "Must load exactly 14 student groups"
    assert db_session.query(SessionModel).count() == 189, "Must load exactly 189 sessions"
    assert db_session.query(BookingRequest).count() == 25, "Must load exactly 25 booking requests"
    assert db_session.query(Exam).count() == 41, "Must load exactly 41 exams"
    assert db_session.query(User).count() == 4, "Must seed 4 demo users"

def test_admin_upload_replacement_dataset(client, db_session):
    admin_token = create_access_token({"sub": "admin@cit.edu", "role": "admin", "name": "Dean"})
    headers = {"Authorization": f"Bearer {admin_token}"}

    with open("data/cit_public.json", "r", encoding="utf-8") as f:
        full_data = json.load(f)
    
    custom_dataset = {
        "dataset_id": "replacement-test-v1",
        "institute": "CIT Replacement Test",
        "calendar": full_data["calendar"],
        "priority_order": full_data["priority_order"],
        "role_category_cap": full_data["role_category_cap"],
        "rooms": full_data["rooms"][:5],
        "room_unavailability": [],
        "faculty": full_data["faculty"][:5],
        "student_groups": full_data["student_groups"][:3],
        "courses": full_data["courses"][:5],
        "sessions": full_data["sessions"][:10],
        "booking_requests": [],
        "cancellations": [],
        "exams": []
    }

    response = client.post(
        "/api/admin/dataset/upload",
        json=custom_dataset,
        headers=headers
    )
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["dataset_id"] == "replacement-test-v1"
    assert res_data["counts"]["rooms"] == 5
    assert res_data["counts"]["faculty"] == 5

    audit = db_session.query(AuditLog).filter(AuditLog.action == "DATASET_REPLACEMENT_UPLOAD").first()
    assert audit is not None
    assert audit.user_email == "admin@cit.edu"

    # Restore original data
    load_cit_dataset(db_session, full_data, reseed_users=True)

def test_admin_reset_demo_data(client, db_session):
    admin_token = create_access_token({"sub": "admin@cit.edu", "role": "admin", "name": "Dean"})
    headers = {"Authorization": f"Bearer {admin_token}"}

    with open("data/cit_public.json", "r", encoding="utf-8") as f:
        full_data = json.load(f)

    load_cit_dataset(db_session, full_data, reseed_users=True)
    assert db_session.query(Room).count() == 27
    assert db_session.query(Faculty).count() == 40
    assert db_session.query(SessionModel).count() == 189
