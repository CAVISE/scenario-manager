from app.security import Role, hash_password, normalize_login, verify_password
from app.models import User
from app.repositories.user_repository_interface import IUserRepository


class UserAlreadyExistsError(Exception):
    pass


class UserNotFoundError(Exception):
    pass


class LastActiveAdminError(Exception):
    pass


class AuthenticationRequiredError(Exception):
    pass


class IncorrectPasswordError(Exception):
    pass


class UserService:
    def __init__(self, repository: IUserRepository):
        self.repository = repository

    def list_users(self) -> list[User]:
        return self.repository.list_all()

    def create_user(
        self,
        login: str,
        password: str,
        role: Role,
    ) -> User:
        normalized_login = normalize_login(login)

        if self.repository.get_by_login(normalized_login) is not None:
            raise UserAlreadyExistsError("User already exists")

        user = User(
            login=normalized_login,
            password_hash=hash_password(password),
            role=role,
        )

        return self.repository.save(user)

    def update_user_status(
        self,
        user_id: int,
        is_active: bool,
    ) -> User:
        admins = self.repository.list_admins_for_update()

        user = self.repository.get_by_id(
            user_id,
            for_update=True,
        )
        if user is None:
            raise UserNotFoundError("User not found")

        if (
            user.role == "admin"
            and user.is_active
            and not is_active
            and sum(admin.is_active for admin in admins) <= 1
        ):
            raise LastActiveAdminError(
                "Cannot deactivate the last active administrator"
            )

        user.is_active = is_active
        return self.repository.save(user)

    def update_user(
        self,
        user_id: int,
        login: str,
        role: Role,
    ) -> User:
        admins = self.repository.list_admins_for_update()
        user = self.repository.get_by_id(user_id, for_update=True)
        if user is None:
            raise UserNotFoundError("User not found")

        normalized_login = normalize_login(login)
        existing_user = self.repository.get_by_login(normalized_login)
        if existing_user is not None and existing_user.id != user.id:
            raise UserAlreadyExistsError("User already exists")

        if (
            user.role == "admin"
            and user.is_active
            and role != "admin"
            and sum(admin.is_active for admin in admins) <= 1
        ):
            raise LastActiveAdminError(
                "Cannot change the role of the last active administrator"
            )

        user.login = normalized_login
        user.role = role
        return self.repository.save(user)

    def reset_user_password(
        self,
        user_id: int,
        new_password: str,
    ) -> None:
        user = self.repository.get_by_id(user_id)

        if user is None:
            raise UserNotFoundError("User not found")

        user.password_hash = hash_password(new_password)
        self.repository.save(user)

    def change_password(
        self,
        user_id: int | None,
        current_password: str,
        new_password: str,
    ) -> None:
        if user_id is None:
            raise AuthenticationRequiredError("Authentication required")

        user = self.repository.get_by_id(
            user_id,
            for_update=True,
        )
        if user is None or not user.is_active:
            raise AuthenticationRequiredError("Authentication required")

        if not verify_password(current_password, user.password_hash):
            raise IncorrectPasswordError("Incorrect current password")

        user.password_hash = hash_password(new_password)
        self.repository.save(user)

    def bootstrap_admin(self, login: str, password: str) -> None:
        normalized_login = normalize_login(login)

        if self.repository.get_by_login(normalized_login) is not None:
            return

        user = User(
            login=normalized_login,
            password_hash=hash_password(password),
            role="admin",
        )
        self.repository.save(user)
