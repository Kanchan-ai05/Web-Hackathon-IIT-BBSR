from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, AuditLog
from ..schemas import LoginRequest, TokenResponse, UserResponse
from ..auth import verify_password, create_access_token, get_current_user
from ..loader import DEMO_ACCOUNTS

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == creds.email).first()
    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "name": user.name}
    )

    # Audit log
    audit = AuditLog(
        user_email=user.email,
        role=user.role,
        action="USER_LOGIN",
        target_type="user",
        target_id=str(user.id),
        details_json="{}"
    )
    db.add(audit)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        email=user.email,
        name=user.name,
        department=user.department
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        department=current_user.department
    )

@router.get("/demo-accounts")
def list_demo_accounts():
    """Returns safe demo account credentials for easy switcher in frontend."""
    return [
        {
            "role": acc["role"],
            "name": acc["name"],
            "email": acc["email"],
            "password": acc["password"],
            "department": acc.get("department")
        }
        for acc in DEMO_ACCOUNTS
    ]
