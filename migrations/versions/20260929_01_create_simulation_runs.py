"""Create durable simulation run queue.

Revision ID: 20260929_01
Revises: 20260904_01
Create Date: 2026-09-29
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260929_01"
down_revision: str | None = "20260904_01"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "simulation_runs",
        sa.Column("run_id", sa.String(length=160), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("map_name", sa.String(length=128), nullable=False),
        sa.Column("scenario_id", sa.String(length=128), nullable=True),
        sa.Column("scenario_name", sa.String(length=200), nullable=True),
        sa.Column("scenario_raw", sa.Text(), nullable=False),
        sa.Column("params", sa.Text(), nullable=False),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("run_id"),
    )
    op.create_index("ix_simulation_runs_status", "simulation_runs", ["status"])


def downgrade() -> None:
    op.drop_index("ix_simulation_runs_status", table_name="simulation_runs")
    op.drop_table("simulation_runs")
