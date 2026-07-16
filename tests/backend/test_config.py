from app.config import Settings


def settings_values(**overrides):
    values = {
        "carla_host": "host.docker.internal",
        "carla_port": 2000,
        "carla_timeout_seconds": 60,
        "db_name": "scenario_manager",
        "db_user": "scenario_manager",
        "db_password": "secret",
        "db_host": "db",
        "db_port": 5432,
        "db_encoding": "UTF8",
    }
    values.update(overrides)
    return values


def test_settings_accept_docker_database_and_carla_timeout():
    settings = Settings(**settings_values())
    assert settings.db_host == "db"
    assert settings.db_port == 5432
    assert settings.carla_traffic_manager_port == 8001
    assert settings.carla_timeout_seconds == 60


def test_settings_accepts_configured_database_host():
    settings = Settings(**settings_values(db_host="external.example.com"))
    assert settings.db_host == "external.example.com"
