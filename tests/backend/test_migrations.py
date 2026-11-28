import json

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect, text


def test_alembic_upgrade_creates_scenarios_table(tmp_path):
    database_path = tmp_path / "migration.db"
    config = Config("alembic.ini")
    config.set_main_option("sqlalchemy.url", f"sqlite:///{database_path.as_posix()}")

    command.upgrade(config, "head")

    engine = create_engine(f"sqlite:///{database_path.as_posix()}")
    inspector = inspect(engine)
    assert "scenarios" in inspector.get_table_names()
    assert "alembic_version" in inspector.get_table_names()
    assert {column["name"] for column in inspector.get_columns("scenarios")} == {
        "id",
        "scenario_id",
        "name_of_scenario",
        "annotation",
        "created_at",
        "updated_at",
        "owner_id",
        "tags",
        "is_archived",
    }
    assert "scenario_versions" in inspector.get_table_names()
    assert "users" in inspector.get_table_names()
    engine.dispose()


def test_migration_preserves_and_reports_legacy_content(tmp_path, capsys):
    database_url = f"sqlite:///{(tmp_path / 'legacy.db').as_posix()}"
    config = Config("alembic.ini")
    config.set_main_option("sqlalchemy.url", database_url)
    command.upgrade(config, "20261107_01")

    original = {
        41: '{"scenario_text":[],"scenario_text":[{"vehicle":"car","path":[]}]}',
        42: '{"scenario_text":"not-a-list"}',
        43: '{"unfinished":',
    }
    engine = create_engine(database_url)
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                INSERT INTO scenarios (id, scenario_id, name_of_scenario, scenario_text)
                VALUES (:id, :scenario_id, 'Legacy', :content)
                """
            ),
            [
                {"id": row_id, "scenario_id": f"old-{row_id}", "content": raw}
                for row_id, raw in original.items()
            ],
        )

    command.upgrade(config, "head")

    with engine.connect() as connection:
        versions = connection.execute(
            text(
                """
                SELECT s.id, s.scenario_id, v.content, v.legacy_scenario_text
                FROM scenarios s JOIN scenario_versions v ON v.scenario_id = s.id
                ORDER BY s.id
                """
            )
        ).all()
    engine.dispose()
    assert [
        (row.id, row.scenario_id, json.loads(row.content), row.legacy_scenario_text)
        for row in versions
    ] == [
        (41, "old-41", json.loads(original[41]), original[41]),
        (42, "old-42", json.loads(original[42]), None),
        (43, "old-43", original[43], None),
    ]
    report = capsys.readouterr().err
    assert "id=41 scenario_id='old-41'" in report
    assert "Duplicate JSON keys" in report
    assert "id=42 scenario_id='old-42'" in report
    assert "Scenario content must contain a list of groups" in report
    assert "id=43 scenario_id='old-43'" in report
    assert "migrated=3, records_with_issues=3" in report
