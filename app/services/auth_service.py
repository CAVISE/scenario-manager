from app.security import (
    AuthenticatedUser,
    create_access_token,
    normalize_login,
    verify_password,
)
from app.repositories.user_repository_interface import IUserRepository


class InvalidCredentialsError(Exception):
    pass


class InvalidUserRoleError(Exception):
    pass


class AuthService:
    def __init__(self, repository: IUserRepository):
        self.repository = repository

    def login(self, login: str, password: str) -> str:
        normalized_login = normalize_login(login)
        user = self.repository.get_by_login(normalized_login)

        if (
            user is None
            or not user.is_active
            or not verify_password(password, user.password_hash)
        ):
            raise InvalidCredentialsError("Invalid login or password")

        return create_access_token(user)

    def get_current_user(self, user_id: int) -> AuthenticatedUser:
        user = self.repository.get_by_id(user_id)

        if user is None or not user.is_active:
            raise InvalidCredentialsError("Authentication required")

        if user.role not in {"admin", "operator", "viewer"}:
            raise InvalidUserRoleError("Invalid user role")

        return AuthenticatedUser(
            id=user.id,
            login=user.login,
            role=user.role,
        )
