import json
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import (
    User,
    AuditLog,
    Room,
    Faculty,
    StudentGroup,
    Course,
    Session as SessionModel,
    BookingRequest,
    Exam
)
from ..auth import require_role
from ..loader import load_cit_dataset, init_db

router = APIRouter(prefix="/api/admin", tags=["Admin Operations"])

@router.post("/dataset/upload")
async def upload_replacement_dataset(
    request: Request,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Admin endpoint to upload replacement CIT dataset in matching JSON format.
    
    Accepts application/json body or multipart/form-data file upload.
    """
    content_type = request.headers.get("content-type", "")
    payload = None

    if "multipart/form-data" in content_type:
        form = await request.form()
        uploaded_file = form.get("file")
        if not uploaded_file:
            raise HTTPException(status_code=400, detail="Missing 'file' field in multipart form")
        content = await uploaded_file.read()
        try:
            payload = json.loads(content.decode("utf-8"))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON in file: {str(e)}")
    else:
        try:
            payload = await request.json()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON body: {str(e)}")

    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Uploaded dataset must be a JSON object")

    # Validate essential schema keys
    required_keys = ["rooms", "faculty", "student_groups", "courses", "sessions"]
    missing = [k for k in required_keys if k not in payload]
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Uploaded dataset is missing required top-level arrays: {', '.join(missing)}"
        )

    try:
        counts = load_cit_dataset(db, payload, reseed_users=False)
        
        # Audit log
        audit = AuditLog(
            user_email=current_user.email,
            role=current_user.role,
            action="DATASET_REPLACEMENT_UPLOAD",
            target_type="dataset",
            target_id=payload.get("dataset_id", "custom-upload"),
            details_json=json.dumps(counts)
        )
        db.add(audit)
        db.commit()

        return {
            "message": "Replacement dataset loaded successfully",
            "dataset_id": payload.get("dataset_id", "custom-upload"),
            "counts": counts
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to reload dataset: {str(e)}")

@router.post("/reset")
def reset_demo_data(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Admin endpoint to restore database to clean original demo state."""
    try:
        counts = init_db()
        
        # Log the reset action
        audit = AuditLog(
            user_email=current_user.email,
            role=current_user.role,
            action="ADMIN_RESET_DEMO_DATA",
            target_type="system",
            target_id="reset",
            details_json=json.dumps(counts)
        )
        db.add(audit)
        db.commit()

        return {
            "message": "Demo data successfully reset to clean original CIT public state",
            "counts": counts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 100,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Retrieve system audit logs for administrative inspection."""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": log.id,
            "user_email": log.user_email,
            "role": log.role,
            "action": log.action,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "details": log.details,
            "timestamp": log.timestamp.isoformat()
        }
        for log in logs
    ]

@router.get("/stats")
def get_database_stats(
    current_user: User = Depends(require_role(["admin", "department_coordinator", "faculty", "club"])),
    db: Session = Depends(get_db)
):
    """Get entity counts and status summary."""
    return {
        "rooms": db.query(Room).count(),
        "faculty": db.query(Faculty).count(),
        "student_groups": db.query(StudentGroup).count(),
        "courses": db.query(Course).count(),
        "sessions": db.query(SessionModel).count(),
        "booking_requests": db.query(BookingRequest).count(),
        "exams": db.query(Exam).count(),
        "users": db.query(User).count()
    }
