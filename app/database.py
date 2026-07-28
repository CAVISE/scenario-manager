from collections.abc import Generator

from fastapi import HTTPException
from sqlalchemy import URL, create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings
from app.log_config import get_logger

log = get_logger(__name__)
settings = get_settings()

database_url = URL.create(
    drivername="postgresql+psycopg",
    username=settings.db_user,
    password=settings.db_password,
    host=settings.db_host,
    port=settings.db_port,
    database=settings.db_name,
)

engine = create_engine(
    database_url,
    connect_args={"client_encoding": settings.db_encoding},
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    except SQLAlchemyError as exc:
        session.rollback()
        log.exception("Database operation failed")
        raise HTTPException(status_code=500, detail="Database operation failed") from exc
    finally:
        session.close()


def initialize_database() -> None:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    log.info("Database connection initialized")


def database_is_ready() -> bool:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except SQLAlchemyError:
        log.exception("Database health check failed")
        return False


def close_database() -> None:
    engine.dispose()
    log.info("Database connections closed")
