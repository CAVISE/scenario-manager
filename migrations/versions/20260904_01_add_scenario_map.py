"""Add map column to scenarios.

Revision ID: 20260904_01
Revises: 20260714_01
Create Date: 2026-09-04
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260904_01"
down_revision: str | None = "20260714_01"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("scenarios", sa.Column("map", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("scenarios", "map")