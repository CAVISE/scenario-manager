from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import (
    JSON,
    CheckConstraint,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    false,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    login: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(512), nullable=False)
    role: Mapped[str] = mapped_column(String(16), nullable=False, default="viewer")
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Scenario(Base):
    __tablename__ = "scenarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    scenario_id: Mapped[str | None] = mapped_column(String, unique=True)
    name_of_scenario: Mapped[str] = mapped_column(String, nullable=False)
    owner_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )
    tags: Mapped[list[str]] = mapped_column(
        JSON().with_variant(JSONB(), "postgresql"),
        default=list,
        server_default="[]",
        nullable=False,
    )
    is_archived: Mapped[bool] = mapped_column(
        default=False,
        server_default=false(),
        nullable=False,
    )
    annotation: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class ScenarioVersion(Base):
    __tablename__ = "scenario_versions"

    __table_args__ = (
        UniqueConstraint(
            "scenario_id",
            "number",
            name="uq_scenario_versions_scenario_number",
        ),
        UniqueConstraint(
            "scenario_id",
            "id",
            name="uq_scenario_versions_scenario_id",
        ),
        UniqueConstraint(
            "scenario_id",
            "idempotency_key",
            name="uq_scenario_versions_idempotency_key",
        ),
        ForeignKeyConstraint(
            ["scenario_id", "previous_version_id"],
            ["scenario_versions.scenario_id", "scenario_versions.id"],
            name="fk_scenario_versions_previous",
        ),
        CheckConstraint(
            "number > 0",
            name="ck_scenario_versions_number_positive",
        ),
        CheckConstraint(
            "previous_version_id IS NULL OR previous_version_id <> id",
            name="ck_scenario_versions_previous_not_self",
        ),
        CheckConstraint(
            "(idempotency_key IS NULL) = (request_hash IS NULL)",
            name="ck_scenario_versions_idempotency_pair",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    scenario_id: Mapped[int] = mapped_column(
        ForeignKey("scenarios.id"),
        nullable=False,
    )
    number: Mapped[int] = mapped_column(nullable=False)
    content: Mapped[Any] = mapped_column(
        JSON().with_variant(JSONB(), "postgresql"),
        nullable=False,
    )
    # Original text when conversion to JSONB loses duplicate keys.
    legacy_scenario_text: Mapped[str | None] = mapped_column(Text)
    previous_version_id: Mapped[int | None] = mapped_column(nullable=True)
    author_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    map: Mapped[str | None] = mapped_column(String)
    file_: Mapped[str | None] = mapped_column(Text)
    preview: Mapped[str | None] = mapped_column(Text)
    idempotency_key: Mapped[UUID | None] = mapped_column(Uuid())
    request_hash: Mapped[str | None] = mapped_column(String(64))


class SimulationRun(Base):
    """Durable queue record; result artifacts remain in evaluation_outputs."""

    __tablename__ = "simulation_runs"

    run_id: Mapped[str] = mapped_column(String(160), primary_key=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    map_name: Mapped[str] = mapped_column(String(128), nullable=False)
    scenario_id: Mapped[str | None] = mapped_column(String(128))
    scenario_name: Mapped[str | None] = mapped_column(String(200))
    scenario_raw: Mapped[str] = mapped_column(Text, nullable=False)
    params: Mapped[str] = mapped_column(Text, nullable=False)
    error: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
