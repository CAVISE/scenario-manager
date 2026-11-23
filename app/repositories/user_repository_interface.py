from abc import ABC, abstractmethod

from app.models import User


class IUserRepository(ABC):
    @abstractmethod
    def get_by_login(self, login: str) -> User | None:
        pass

    @abstractmethod
    def list_all(self) -> list[User]:
        pass

    @abstractmethod
    def save(self, user: User) -> User:
        pass

    @abstractmethod
    def get_by_id(self, user_id: int, for_update: bool = False) -> User | None:
        pass

    @abstractmethod
    def list_admins_for_update(self) -> list[User]:
        pass
