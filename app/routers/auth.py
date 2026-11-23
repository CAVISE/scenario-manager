from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.auth import (
    AuthenticatedUser,
    create_access_token,
    hash_password,
    normalize_login,
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
    UserResponse,
    UpdateUserRequest,
    UpdateUserStatusRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])
DatabaseSession = Annotated[Session, Depends(get_session)]


@router.post("/login", response_model=AccessTokenResponse)
@limiter.limit("5/minute")
def login(
    request: Request, body: LoginRequest, response: Response, session: DatabaseSession
):
    user = session.scalar(select(User).where(User.login == normalize_login(body.login)))
    if (
        user is None
        or not user.is_active
        or not verify_password(body.password, user.password_hash)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid login or password"
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
        login=user.login,
        role=user.role,
        authentication_enabled=get_settings().auth_jwt_secret is not None,
    )


@router.get("/users", response_model=list[UserResponse])
def list_users(
    session: DatabaseSession,
    _: AuthenticatedUser = Depends(require_roles("admin")),
):
    users = session.scalars(select(User).order_by(User.id)).all()
    return [
        UserResponse(
            id=user.id,
            login=user.login,
            role=user.role,
            is_admin=user.role == "admin",
            is_active=user.is_active,
        )
        for user in users
    ]


@router.post(
    "/users", response_model=CurrentUserResponse, status_code=status.HTTP_201_CREATED
)
def create_user(
    body: CreateUserRequest,
    session: DatabaseSession,
    _: AuthenticatedUser = Depends(require_roles("admin")),
):
    login = normalize_login(body.login)
    if session.scalar(select(User.id).where(User.login == login)) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="User already exists"
        )
    user = User(login=login, password_hash=hash_password(body.password), role=body.role)
    session.add(user)
    session.commit()
    return CurrentUserResponse(
        login=user.login,
        role=user.role,
        authentication_enabled=True,
    )


@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    body: UpdateUserRequest,
    response: Response,
    session: DatabaseSession,
    authenticated_user: AuthenticatedUser = Depends(require_roles("admin")),
):
    admins = session.scalars(
        select(User)
        .where(User.role == "admin")
        .order_by(User.id)
        .with_for_update()
        .execution_options(populate_existing=True)
    ).all()
    user = session.get(User, user_id, with_for_update=True, populate_existing=True)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    login = normalize_login(body.login)
    existing_id = session.scalar(select(User.id).where(User.login == login))
    if existing_id is not None and existing_id != user.id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

    if (
        user.role == "admin"
        and user.is_active
        and body.role != "admin"
        and sum(admin.is_active for admin in admins) <= 1
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot change the role of the last active administrator",
        )

    user.login = login
    user.role = body.role
    session.commit()

    if authenticated_user.id == user.id:
        response.delete_cookie("access_token", httponly=True, samesite="lax")

    return UserResponse(
        id=user.id,
        login=user.login,
        role=user.role,
        is_admin=user.role == "admin",
        is_active=user.is_active,
    )


@router.patch("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: int,
    body: UpdateUserStatusRequest,
    session: DatabaseSession,
    _: AuthenticatedUser = Depends(require_roles("admin")),
):
    admins = session.scalars(
        select(User)
        .where(User.role == "admin")
        .order_by(User.id)
        .with_for_update()
        .execution_options(populate_existing=True)
    ).all()

    user = session.get(User, user_id, with_for_update=True, populate_existing=True)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if (
        user.role == "admin"
        and user.is_active
        and not body.is_active
        and sum(admin.is_active for admin in admins) <= 1
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot deactivate the last active administrator",
        )

    user.is_active = body.is_active
    session.commit()

    return UserResponse(
        id=user.id,
        login=user.login,
        role=user.role,
        is_admin=user.role == "admin",
        is_active=user.is_active,
    )


@router.post(
    "/users/{user_id}/reset-password",
    status_code=status.HTTP_204_NO_CONTENT,
)
def reset_user_password(
    user_id: int,
    body: ResetPasswordRequest,
    session: DatabaseSession,
    _: AuthenticatedUser = Depends(require_roles("admin")),
):
    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.password_hash = hash_password(body.new_password)
    session.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    body: ChangePasswordRequest,
    session: DatabaseSession,
    authenticated_user: AuthenticatedUser = Depends(
        require_roles("admin", "operator", "viewer")
    ),
):
    if authenticated_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    user = session.get(
        User,
        authenticated_user.id,
        with_for_update=True,
        populate_existing=True,
    )
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password",
        )

    user.password_hash = hash_password(body.new_password)
    session.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
