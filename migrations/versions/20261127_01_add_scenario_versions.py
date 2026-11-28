"""add scenario versions

Revision ID: 20261127_01
Revises: 20261107_01
Create Date: 2026-11-27 17:03:11.664181
"""

import json
import logging
from functools import partial
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20261127_01"
down_revision: Union[str, Sequence[str], None] = "20261107_01"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None
log = logging.getLogger("alembic.runtime.migration")


def _keep_last_json_keys(pairs: list[tuple], *, duplicate_keys: set[str]) -> dict:
    result = {}
    for key, value in pairs:
        if key in result:
            duplicate_keys.add(key)
        result[key] = value
    return result


def _reject_json_constant(value: str) -> None:
    raise ValueError(f"Non-standard JSON value: {value}")


def _prepare_legacy_content(raw: str | None) -> tuple[str, str | None, list[str]]:
    if raw is None:
        return "null", None, []

    duplicate_keys: set[str] = set()
    try:
        parsed = json.loads(
            raw,
            object_pairs_hook=partial(
                _keep_last_json_keys, duplicate_keys=duplicate_keys
            ),
            parse_constant=_reject_json_constant,
            parse_int=str,
            parse_float=str,
        )
    except (ValueError, RecursionError) as exc:
        return json.dumps(raw, ensure_ascii=True), None, [str(exc)]

    issues = []
    if duplicate_keys:
        issues.append("Duplicate JSON keys in original text")

    groups = parsed.get("scenario_text") if isinstance(parsed, dict) else parsed
    if groups is not None and not isinstance(groups, list):
        issues.append("Scenario content must contain a list of groups")
    elif groups and any(not isinstance(group, dict) for group in groups):
        issues.append("Scenario groups must be JSON objects")

    return raw, raw if duplicate_keys else None, issues


def _insert_legacy_version(connection: sa.Connection, row: dict) -> list[str]:
    content, legacy_text, issues = _prepare_legacy_content(row["scenario_text"])

    number = row["revision"]
    if number is None or number < 1:
        issues.append(f"Invalid revision {number!r}; saved as version 1")
        number = 1

    is_postgres = connection.dialect.name == "postgresql"
    content_sql = "CAST(:content AS JSONB)" if is_postgres else ":content"

    statement = sa.text(
        f"""
        INSERT INTO scenario_versions (
            scenario_id, number, content, legacy_scenario_text,
            created_at, map, file_, preview
        )
        VALUES (
            :scenario_id, :number, {content_sql}, :legacy_scenario_text,
            COALESCE(:created_at, CURRENT_TIMESTAMP),
            :map, :file_, :preview
        )
        """
    ).bindparams(sa.bindparam("created_at", type_=sa.DateTime(timezone=True)))

    values = {
        "scenario_id": row["id"],
        "number": number,
        "content": content,
        "legacy_scenario_text": legacy_text,
        "created_at": row["updated_at"] or row["created_at"],
        "map": row["map"],
        "file_": row["file_"],
        "preview": row["preview"],
    }

    try:
        with connection.begin_nested():
            connection.execute(statement, values)
    except sa.exc.DataError as exc:
        if not is_postgres:
            raise

        issues.append(f"JSONB rejected content: {exc.orig.diag.message_primary}")
        values["content"] = json.dumps(
            row["scenario_text"],
            ensure_ascii=True,
        )
        values["legacy_scenario_text"] = None
        with connection.begin_nested():
            connection.execute(statement, values)

    return issues


def _copy_existing_scenarios() -> None:
    connection = op.get_bind()

    statement = sa.text(
        """
        SELECT
            id, scenario_id, revision, scenario_text,
            created_at, updated_at, map, file_, preview
        FROM scenarios
        ORDER BY id
        """
    ).columns(
        created_at=sa.DateTime(timezone=True),
        updated_at=sa.DateTime(timezone=True),
    )

    migrated = 0
    records_with_issues = 0

    with connection.execute(statement.execution_options(yield_per=10)) as result:
        for row in result.mappings():
            issues = _insert_legacy_version(connection, dict(row))
            migrated += 1

            if issues:
                records_with_issues += 1
                log.warning(
                    "Scenario migration issue: id=%s scenario_id=%r issues=%s",
                    row["id"],
                    row["scenario_id"],
                    json.dumps(issues, ensure_ascii=True),
                )

    log.info(
        "Scenario version migration report: migrated=%s, records_with_issues=%s",
        migrated,
        records_with_issues,
    )


def upgrade() -> None:
    op.create_table(
        "scenario_versions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("scenario_id", sa.Integer(), nullable=False),
        sa.Column("number", sa.Integer(), nullable=False),
        sa.Column(
            "content",
            sa.JSON().with_variant(
                postgresql.JSONB(astext_type=sa.Text()), "postgresql"
            ),
            nullable=False,
        ),
        sa.Column("legacy_scenario_text", sa.Text(), nullable=True),
        sa.Column("previous_version_id", sa.Integer(), nullable=True),
        sa.Column("author_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("map", sa.String(), nullable=True),
        sa.Column("file_", sa.Text(), nullable=True),
        sa.Column("preview", sa.Text(), nullable=True),
        sa.Column("idempotency_key", sa.Uuid(), nullable=True),
        sa.Column("request_hash", sa.String(64), nullable=True),
        sa.CheckConstraint("number > 0", name="ck_scenario_versions_number_positive"),
        sa.CheckConstraint(
            "previous_version_id IS NULL OR previous_version_id <> id",
            name="ck_scenario_versions_previous_not_self",
        ),
        sa.CheckConstraint(
            "(idempotency_key IS NULL) = (request_hash IS NULL)",
            name="ck_scenario_versions_idempotency_pair",
        ),
        sa.ForeignKeyConstraint(
            ["author_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["scenario_id", "previous_version_id"],
            ["scenario_versions.scenario_id", "scenario_versions.id"],
            name="fk_scenario_versions_previous",
        ),
        sa.ForeignKeyConstraint(
            ["scenario_id"],
            ["scenarios.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "scenario_id", "id", name="uq_scenario_versions_scenario_id"
        ),
        sa.UniqueConstraint(
            "scenario_id", "number", name="uq_scenario_versions_scenario_number"
        ),
        sa.UniqueConstraint(
            "scenario_id",
            "idempotency_key",
            name="uq_scenario_versions_idempotency_key",
        ),
    )
    with op.batch_alter_table("scenarios") as batch_op:
        batch_op.add_column(sa.Column("owner_id", sa.Integer(), nullable=True))
        batch_op.add_column(
            sa.Column(
                "tags",
                sa.JSON().with_variant(postgresql.JSONB(), "postgresql"),
                server_default="[]",
                nullable=False,
            )
        )
        batch_op.add_column(
            sa.Column(
                "is_archived",
                sa.Boolean(),
                server_default=sa.false(),
                nullable=False,
            )
        )
        batch_op.create_foreign_key(
            "fk_scenarios_owner",
            "users",
            ["owner_id"],
            ["id"],
        )
    _copy_existing_scenarios()

    with op.batch_alter_table("scenarios") as batch_op:
        batch_op.drop_column("revision")
        batch_op.drop_column("scenario_text")
        batch_op.drop_column("map")
        batch_op.drop_column("file_")
        batch_op.drop_column("preview")


def downgrade() -> None:
    raise RuntimeError("Downgrade would discard scenario version history.")
