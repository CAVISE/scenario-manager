import re

from alembic import op
import sqlalchemy as sa

revision = "20261107_01"
down_revision = "20260929_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    connection = op.get_bind()

    users = connection.execute(sa.text("SELECT id, email FROM users")).mappings().all()

    for user in users:
        login = user["email"].split("@", 1)[0].strip().lower()

        if re.fullmatch(r"[a-z0-9_]{3,320}", login) is None:
            raise ValueError(f"Invalid login for user id={user['id']}")

        connection.execute(
            sa.text("UPDATE users SET email = :login WHERE id = :id"),
            {"login": login, "id": user["id"]},
        )

    op.drop_index("ix_users_email", table_name="users")

    op.alter_column(
        "users",
        "email",
        new_column_name="login",
    )

    op.create_index("ix_users_login", "users", ["login"], unique=True)


def downgrade() -> None:
    raise RuntimeError("Original emails cannot be restored after removing domains.")
