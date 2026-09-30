from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.auth import (
    AuthenticatedUser,
    create_access_token,
    hash_password,
    normalize_email,
    require_roles,
    verify_password,
)
from app.config import get_settings
from app.database import get_session
from app.models import User
from app.rate_limit import limiter
from app.schemas import (
    AccessTokenResponse,
    CreateUserRequest,
    CurrentUserResponse,
    LoginRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])
DatabaseSession = Annotated[Session, Depends(get_session)]


@router.post("/login", response_model=AccessTokenResponse)
@limiter.limit("5/minute")
def login(
    request: Request, body: LoginRequest, response: Response, session: DatabaseSession
):
    user = session.scalar(select(User).where(User.email == normalize_email(body.email)))
    if (
        user is None
        or not user.is_active
        or not verify_password(body.password, user.password_hash)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )
    token = create_access_token(user)
    settings = get_settings()
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=settings.app_environment == "production",
        samesite="lax",
        max_age=settings.auth_access_token_expire_minutes * 60,
    )
    return AccessTokenResponse(
        access_token=token, expires_in=settings.auth_access_token_expire_minutes * 60
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response):
    response.delete_cookie("access_token", httponly=True, samesite="lax")


@router.get("/me", response_model=CurrentUserResponse)
def current_user(
    user: AuthenticatedUser = Depends(require_roles("admin", "operator", "viewer")),
):
    return CurrentUserResponse(
        email=user.email,
        role=user.role,
        authentication_enabled=get_settings().auth_jwt_secret is not None,
    )


@router.post(
    "/users", response_model=CurrentUserResponse, status_code=status.HTTP_201_CREATED
)
def create_user(
    body: CreateUserRequest,
    session: DatabaseSession,
    _: AuthenticatedUser = Depends(require_roles("admin")),
):
    email = normalize_email(body.email)
    if session.scalar(select(User.id).where(User.email == email)) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="User already exists"
        )
    user = User(email=email, password_hash=hash_password(body.password), role=body.role)
    session.add(user)
    session.commit()
    return CurrentUserResponse(
        email=user.email,
        role=user.role,
        authentication_enabled=True,
    )
