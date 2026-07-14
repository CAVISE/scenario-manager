from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect


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
        "scenario_text",
        "preview",
        "annotation",
        "file_",
        "created_at",
        "updated_at",
    }
    engine.dispose()
