"""Authentication dependencies and administrator initialization."""

from __future__ import annotations

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from starlette.requests import HTTPConnection

from app.config import get_settings
from app.dependencies import get_auth_service
from app.security import (
    AuthenticatedUser,
    Role,
    create_access_token,
    decode_access_token,
    hash_password,
    normalize_login,
    verify_password,
)
from app.repositories.user_repository import UserRepository
from app.services.auth_service import (
    AuthService,
    InvalidCredentialsError,
    InvalidUserRoleError,
)
from app.services.user_service import UserService

__all__ = [
    "AuthenticatedUser",
    "Role",
    "bootstrap_admin",
    "create_access_token",
    "get_current_user",
    "hash_password",
    "normalize_login",
    "require_roles",
    "verify_password",
]


def _extract_access_token(connection: HTTPConnection) -> str:
    authorization = connection.headers.get("Authorization", "")
    if authorization.startswith("Bearer "):
        return authorization[len("Bearer ") :]
    return connection.cookies.get("access_token") or connection.query_params.get(
        "access_token", ""
    )


def get_current_user(
    connection: HTTPConnection,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthenticatedUser:
    settings = get_settings()

    if settings.auth_jwt_secret is None:
        return AuthenticatedUser(
            id=None,
            login="development",
            role="admin",
        )

    try:
        payload = decode_access_token(_extract_access_token(connection))
        user_id = int(payload["sub"])
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    try:
        return auth_service.get_current_user(user_id)
    except InvalidCredentialsError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc
    except InvalidUserRoleError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc


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
    login = settings.auth_bootstrap_admin_login
    password = settings.auth_bootstrap_admin_password

    if not login or password is None:
        return

    repository = UserRepository(session)
    user_service = UserService(repository)
    user_service.bootstrap_admin(
        login=login,
        password=password.get_secret_value(),
    )
