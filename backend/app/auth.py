import os
import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .config import settings
from .database import get_db
from .models import User

try:
    from jose import JWTError, jwt
except ImportError:
    import base64
    import json

    class JWTFallback:
        @staticmethod
        def encode(payload: dict, key: str, algorithm: str = "HS256") -> str:
            header = {"alg": algorithm, "typ": "JWT"}
            h_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
            p_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
            msg = f"{h_b64}.{p_b64}".encode()
            sig = hmac.new(key.encode(), msg, hashlib.sha256).digest()
            s_b64 = base64.urlsafe_b64encode(sig).decode().rstrip("=")
            return f"{h_b64}.{p_b64}.{s_b64}"

        @staticmethod
        def decode(token: str, key: str, algorithms: list = None) -> dict:
            parts = token.split(".")
            if len(parts) != 3:
                raise ValueError("Invalid token structure")
            h_b64, p_b64, s_b64 = parts
            msg = f"{h_b64}.{p_b64}".encode()
            expected_sig = hmac.new(key.encode(), msg, hashlib.sha256).digest()
            # Padding
            rem = len(s_b64) % 4
            if rem > 0:
                s_b64 += "=" * (4 - rem)
            actual_sig = base64.urlsafe_b64decode(s_b64.encode())
            if not hmac.compare_digest(expected_sig, actual_sig):
                raise ValueError("Signature mismatch")
            p_rem = len(p_b64) % 4
            if p_rem > 0:
                p_b64 += "=" * (4 - p_rem)
            payload = json.loads(base64.urlsafe_b64decode(p_b64.encode()).decode())
            if "exp" in payload and datetime.utcnow().timestamp() > payload["exp"]:
                raise ValueError("Token expired")
            return payload

    jwt = JWTFallback()
    class JWTError(Exception):
        pass

try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    def hash_pwd(pwd: str) -> str:
        return pwd_context.hash(pwd)
    def verify_pwd(pwd: str, hashed: str) -> bool:
        if hashed.startswith("sha256$"):
            salt, h = hashed.split("$")[1:3]
            return hmac.new(salt.encode(), pwd.encode(), hashlib.sha256).hexdigest() == h
        return pwd_context.verify(pwd, hashed)
except Exception:
    def hash_pwd(pwd: str) -> str:
        salt = os.urandom(16).hex()
        h = hmac.new(salt.encode(), pwd.encode(), hashlib.sha256).hexdigest()
        return f"sha256${salt}${h}"
    def verify_pwd(pwd: str, hashed: str) -> bool:
        if hashed.startswith("sha256$"):
            salt, h = hashed.split("$")[1:3]
            return hmac.new(salt.encode(), pwd.encode(), hashlib.sha256).hexdigest() == h
        return False

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return verify_pwd(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return hash_pwd(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire.timestamp() if hasattr(jwt, 'encode') and not hasattr(jwt, 'JWTFallback') else expire})
    if hasattr(jwt, 'encode'):
        encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    else:
        encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or missing token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def require_role(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Operation requires one of the following roles: {', '.join(allowed_roles)}. Current role: {current_user.role}"
            )
        return current_user
    return role_checker
