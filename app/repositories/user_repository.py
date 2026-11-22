from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User
from app.repositories.user_repository_interface import IUserRepository


class UserRepository(IUserRepository):
    def __init__(self, session: Session):
        self.session = session

    def get_by_login(self, login: str) -> User | None:
        return self.session.scalar(select(User).where(User.login == login))

    def list_all(self) -> list[User]:
        return list(self.session.scalars(select(User).order_by(User.id)).all())

    def save(self, user: User) -> User:
        self.session.add(user)
        self.session.commit()
        return user

    def get_by_id(self, user_id: int, for_update: bool = False) -> User | None:
        query = select(User).where(User.id == user_id)

        if for_update:
            query = query.with_for_update().execution_options(populate_existing=True)

        return self.session.scalar(query)

    def list_admins_for_update(self) -> list[User]:
        return list(
            self.session.scalars(
                select(User)
                .where(User.role == "admin")
                .order_by(User.id)
                .with_for_update()
                .execution_options(populate_existing=True)
            ).all()
        )
