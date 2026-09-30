"""JWT authentication, password hashing, and role checks for the API."""

from __future__ import annotations
import base64
import hashlib
import hmac
import json
import secrets
import time
from dataclasses import dataclass
from typing import Literal
from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from starlette.requests import HTTPConnection
from app.config import get_settings
from app.database import get_session
from app.models import User

Role = Literal["admin", "operator", "viewer"]
_PASSWORD_ITERATIONS = 600_000
_TOKEN_ALGORITHM = "HS256"


@dataclass(frozen=True)
class AuthenticatedUser:
    id: int | None
    email: str
    role: Role


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _b64decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, _PASSWORD_ITERATIONS
    )
    return (
        f"pbkdf2_sha256${_PASSWORD_ITERATIONS}${_b64encode(salt)}${_b64encode(digest)}"
    )


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, encoded_salt, encoded_digest = stored_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            _b64decode(encoded_salt),
            int(iterations),
        )
        return hmac.compare_digest(_b64encode(digest), encoded_digest)
    except (TypeError, ValueError):
        return False


def create_access_token(user: User) -> str:
    settings = get_settings()
    if settings.auth_jwt_secret is None:
        raise RuntimeError("JWT authentication is not configured")
    now = int(time.time())
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "iat": now,
        "exp": now + settings.auth_access_token_expire_minutes * 60,
    }
    header = {"alg": _TOKEN_ALGORITHM, "typ": "JWT"}
    signing_input = ".".join(
        (
            _b64encode(json.dumps(header, separators=(",", ":")).encode("utf-8")),
            _b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8")),
        )
    )
    signature = hmac.digest(
        settings.auth_jwt_secret.get_secret_value().encode("utf-8"),
        signing_input.encode("ascii"),
        "sha256",
    )
    return f"{signing_input}.{_b64encode(signature)}"


def _decode_access_token(token: str) -> dict[str, object]:
    settings = get_settings()
    if settings.auth_jwt_secret is None:
        raise ValueError("JWT authentication is not configured")
    try:
        encoded_header, encoded_payload, encoded_signature = token.split(".")
        header = json.loads(_b64decode(encoded_header))
        payload = json.loads(_b64decode(encoded_payload))
        if header.get("alg") != _TOKEN_ALGORITHM:
            raise ValueError("unexpected JWT algorithm")
        signing_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
        expected_signature = hmac.digest(
            settings.auth_jwt_secret.get_secret_value().encode("utf-8"),
            signing_input,
            "sha256",
        )
        if not hmac.compare_digest(expected_signature, _b64decode(encoded_signature)):
            raise ValueError("invalid JWT signature")
        if not isinstance(payload, dict) or int(payload["exp"]) <= int(time.time()):
            raise ValueError("expired JWT")
        return payload
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        raise ValueError("invalid access token") from exc


def _extract_access_token(connection: HTTPConnection) -> str:
    authorization = connection.headers.get("Authorization", "")
    if authorization.startswith("Bearer "):
        return authorization[len("Bearer ") :]
    return connection.cookies.get("access_token") or connection.query_params.get(
        "access_token", ""
    )


def get_current_user(
    connection: HTTPConnection, session: Session = Depends(get_session)
) -> AuthenticatedUser:
    settings = get_settings()
    if settings.auth_jwt_secret is None:
        return AuthenticatedUser(id=None, email="development@local", role="admin")
    try:
        payload = _decode_access_token(_extract_access_token(connection))
        user_id = int(payload["sub"])
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None
    user = session.scalar(select(User).where(User.id == user_id))
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required"
        )
    if user.role not in {"admin", "operator", "viewer"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid user role"
        )
    return AuthenticatedUser(id=user.id, email=user.email, role=user.role)


def require_roles(*roles: Role):
    def dependency(
        user: AuthenticatedUser = Depends(get_current_user),
    ) -> AuthenticatedUser:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions"
            )
        return user

    return dependency


def bootstrap_admin(session: Session) -> None:
    settings = get_settings()
    email = settings.auth_bootstrap_admin_email
    password = settings.auth_bootstrap_admin_password
    if not email or password is None:
        return
    normalized_email = normalize_email(email)
    if (
        session.scalar(select(User.id).where(User.email == normalized_email))
        is not None
    ):
        return
    session.add(
        User(
            email=normalized_email,
            password_hash=hash_password(password.get_secret_value()),
            role="admin",
        )
    )
    session.commit()
