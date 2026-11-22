from fastapi import Depends
from sqlalchemy.orm import Session

from app.database import get_session
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.services.user_service import UserService


def get_auth_service(
    session: Session = Depends(get_session),
) -> AuthService:
    repository = UserRepository(session)
    return AuthService(repository)


def get_user_service(
    session: Session = Depends(get_session),
) -> UserService:
    repository = UserRepository(session)
    return UserService(repository)
