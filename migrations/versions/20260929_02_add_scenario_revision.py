"""Add optimistic locking revision to scenarios."""
from alembic import op
import sqlalchemy as sa

revision = "20260929_02"
down_revision = "20260929_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("scenarios", sa.Column("revision", sa.Integer(), nullable=True))
    op.execute("UPDATE scenarios SET revision = 1 WHERE revision IS NULL")
    if op.get_bind().dialect.name == "sqlite":
        with op.batch_alter_table("scenarios") as batch_op:
            batch_op.alter_column(
                "revision",
                existing_type=sa.Integer(),
                nullable=False,
                server_default="1",
            )
    else:
        op.alter_column("scenarios", "revision", nullable=False, server_default="1")


def downgrade() -> None:
    op.drop_column("scenarios", "revision")
