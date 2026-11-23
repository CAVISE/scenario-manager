from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from app.auth import AuthenticatedUser, require_roles
from app.config import get_settings
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
from app.dependencies import get_auth_service, get_user_service
from app.services.auth_service import AuthService, InvalidCredentialsError
from app.services.user_service import (
    AuthenticationRequiredError,
    IncorrectPasswordError,
    LastActiveAdminError,
    UserAlreadyExistsError,
    UserNotFoundError,
    UserService,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=AccessTokenResponse)
@limiter.limit("5/minute")
def login(
    request: Request,
    body: LoginRequest,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
):
    try:
        token = auth_service.login(body.login, body.password)
    except InvalidCredentialsError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc

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
        access_token=token,
        expires_in=settings.auth_access_token_expire_minutes * 60,
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


@router.post(
    "/users", response_model=CurrentUserResponse, status_code=status.HTTP_201_CREATED
)
def create_user(
    body: CreateUserRequest,
    user_service: UserService = Depends(get_user_service),
    _: AuthenticatedUser = Depends(require_roles("admin")),
):
    try:
        user = user_service.create_user(
            login=body.login,
            password=body.password,
            role=body.role,
        )
    except UserAlreadyExistsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    return CurrentUserResponse(
        login=user.login,
        role=user.role,
        authentication_enabled=True,
    )


@router.get("/users", response_model=list[UserResponse])
def list_users(
    user_service: UserService = Depends(get_user_service),
    _: AuthenticatedUser = Depends(require_roles("admin")),
):
    users = user_service.list_users()

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


@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    body: UpdateUserRequest,
    response: Response,
    user_service: UserService = Depends(get_user_service),
    authenticated_user: AuthenticatedUser = Depends(require_roles("admin")),
):
    try:
        user = user_service.update_user(
            user_id=user_id,
            login=body.login,
            role=body.role,
        )
    except UserNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except UserAlreadyExistsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except LastActiveAdminError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

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
    user_service: UserService = Depends(get_user_service),
    _: AuthenticatedUser = Depends(require_roles("admin")),
):
    try:
        user = user_service.update_user_status(
            user_id=user_id,
            is_active=body.is_active,
        )
    except UserNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except LastActiveAdminError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

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
    user_service: UserService = Depends(get_user_service),
    _: AuthenticatedUser = Depends(require_roles("admin")),
):
    try:
        user_service.reset_user_password(
            user_id=user_id,
            new_password=body.new_password,
        )
    except UserNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    body: ChangePasswordRequest,
    user_service: UserService = Depends(get_user_service),
    authenticated_user: AuthenticatedUser = Depends(
        require_roles("admin", "operator", "viewer")
    ),
):
    try:
        user_service.change_password(
            user_id=authenticated_user.id,
            current_password=body.current_password,
            new_password=body.new_password,
        )
    except AuthenticationRequiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc
    except IncorrectPasswordError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return Response(status_code=status.HTTP_204_NO_CONTENT)
