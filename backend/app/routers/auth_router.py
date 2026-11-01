import secrets
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, AuditLog, PasswordResetToken
from ..schemas import (
    LoginRequest,
    TokenResponse,
    UserResponse,
    RegisterRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserRoleUpdateRequest,
    FullUserResponse
)
from ..auth import (
    verify_password,
    create_access_token,
    get_current_user,
    get_optional_current_user,
    require_role,
    get_password_hash
)
from ..loader import DEMO_ACCOUNTS

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with email and password, returning JWT bearer token."""
    email = creds.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if hasattr(user, "is_active") and user.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact campus administration.",
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

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Public user registration with anti-privilege escalation safeguards."""
    email = req.email.strip().lower()
    name = req.name.strip()
    role_requested = (req.role or "student").strip().lower()

    # Disallow administrator self-assignment
    if role_requested in ("admin", "administrator"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator accounts cannot be created via public registration. Contact the Dean's Office."
        )

    # Validate allowed roles
    allowed_roles = {"student", "faculty", "club", "coordinator", "department_coordinator"}
    if role_requested not in allowed_roles:
        role_requested = "student"

    # Check if user already exists
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Password policy
    if len(req.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters in length."
        )

    hashed = get_password_hash(req.password)
    user = User(
        email=email,
        name=name,
        role=role_requested,
        department=req.department.strip() if req.department else None,
        hashed_password=hashed,
        is_active=True,
        created_at=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Audit log
    audit = AuditLog(
        user_email=user.email,
        role=user.role,
        action="USER_REGISTER",
        target_type="user",
        target_id=str(user.id),
        details_json=f'{{"role": "{user.role}", "department": "{user.department}"}}'
    )
    db.add(audit)
    db.commit()

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "name": user.name}
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        email=user.email,
        name=user.name,
        department=user.department
    )

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generate secure password reset token for account recovery."""
    email = req.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No account found registered under email: {email}"
        )

    token = secrets.token_hex(16)
    expires_at = datetime.utcnow() + timedelta(minutes=30)

    reset_record = PasswordResetToken(
        email=email,
        token=token,
        expires_at=expires_at,
        used=False,
        created_at=datetime.utcnow()
    )
    db.add(reset_record)

    audit = AuditLog(
        user_email=email,
        role=user.role,
        action="PASSWORD_RESET_REQUESTED",
        target_type="user",
        target_id=str(user.id),
        details_json=f'{{"expires_at": "{expires_at.isoformat()}"}}'
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "message": "Password reset token generated. Use it within 30 minutes to set a new password.",
        "email": email,
        "reset_token": token,
        "expires_in_minutes": 30
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using verified unexpired token."""
    email = req.email.strip().lower()
    token = req.token.strip()

    record = db.query(PasswordResetToken).filter(
        PasswordResetToken.email == email,
        PasswordResetToken.token == token,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > datetime.utcnow()
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid, expired, or previously used password reset token."
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account no longer exists."
        )

    if len(req.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters in length."
        )

    user.hashed_password = get_password_hash(req.new_password)
    record.used = True

    audit = AuditLog(
        user_email=email,
        role=user.role,
        action="PASSWORD_RESET_SUCCESS",
        target_type="user",
        target_id=str(user.id),
        details_json="{}"
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "message": "Password reset successful! You may now sign in with your new credentials."
    }

@router.post("/logout")
def logout(current_user: Optional[User] = Depends(get_optional_current_user), db: Session = Depends(get_db)):
    """Log out active session and record audit trail."""
    if current_user:
        audit = AuditLog(
            user_email=current_user.email,
            role=current_user.role,
            action="USER_LOGOUT",
            target_type="user",
            target_id=str(current_user.id),
            details_json="{}"
        )
        db.add(audit)
        db.commit()

    return {
        "status": "success",
        "message": "User session closed successfully."
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return currently authenticated user profile."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        department=current_user.department,
        is_active=getattr(current_user, "is_active", True)
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

# =========================================================================
# Administrator User & Role Management Endpoints
# =========================================================================

@router.get("/users", response_model=List[FullUserResponse])
def list_all_users(
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Admin-only: Retrieve all registered users across the institution."""
    users = db.query(User).order_by(User.id.asc()).all()
    res = []
    for u in users:
        created_str = u.created_at.isoformat() if hasattr(u, "created_at") and u.created_at else None
        res.append(
            FullUserResponse(
                id=u.id,
                email=u.email,
                name=u.name,
                role=u.role,
                department=u.department,
                is_active=getattr(u, "is_active", True),
                created_at=created_str
            )
        )
    return res

@router.patch("/users/{user_id}/role", response_model=FullUserResponse)
def update_user_role_and_status(
    user_id: int,
    req: UserRoleUpdateRequest,
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Admin-only: Update a user's role, department, or active status."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )

    # Protect against demoting or disabling the only active administrator
    if target_user.role == "admin" and (req.role != "admin" or req.is_active is False):
        other_admins = db.query(User).filter(
            User.role == "admin",
            User.id != target_user.id,
            User.is_active == True
        ).count()
        if other_admins == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote or deactivate the sole remaining active Administrator."
            )

    if req.role:
        target_user.role = req.role.strip().lower()
    if req.department is not None:
        target_user.department = req.department.strip() if req.department else None
    if req.is_active is not None:
        target_user.is_active = req.is_active

    audit = AuditLog(
        user_email=admin.email,
        role=admin.role,
        action="USER_ROLE_UPDATED",
        target_type="user",
        target_id=str(target_user.id),
        details_json=f'{{"updated_by": "{admin.email}", "new_role": "{target_user.role}", "active": {target_user.is_active}}}'
    )
    db.add(audit)
    db.commit()
    db.refresh(target_user)

    created_str = target_user.created_at.isoformat() if hasattr(target_user, "created_at") and target_user.created_at else None
    return FullUserResponse(
        id=target_user.id,
        email=target_user.email,
        name=target_user.name,
        role=target_user.role,
        department=target_user.department,
        is_active=getattr(target_user, "is_active", True),
        created_at=created_str
    )

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Admin-only: Delete a user account from the system."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )

    if target_user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot delete their own active account."
        )

    if target_user.role == "admin":
        other_admins = db.query(User).filter(
            User.role == "admin",
            User.id != target_user.id
        ).count()
        if other_admins == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the sole remaining Administrator."
            )

    email_deleted = target_user.email
    db.delete(target_user)

    audit = AuditLog(
        user_email=admin.email,
        role=admin.role,
        action="USER_DELETED",
        target_type="user",
        target_id=str(user_id),
        details_json=f'{{"deleted_email": "{email_deleted}", "by": "{admin.email}"}}'
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "message": f"User account '{email_deleted}' (ID {user_id}) successfully deleted."
    }
