from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).parent.parent


class Settings(BaseSettings):
    # CARLA
    carla_host: str = "localhost"
    carla_port: int = 2000

    db_name: str = ""
    db_user: str = ""
    db_password: str = ""
    db_host: str = "localhost"
    db_port: int = 5432
    db_encoding: str = "UTF8"

    base_dir: Path = BASE_DIR
    cfg_dir: Path = BASE_DIR / "assets" / "opencda"
    xodr_dir: Path = BASE_DIR / "assets" / "xodrs"
    eval_dir: Path = BASE_DIR / "evaluation_outputs"
    log_dir: Path = BASE_DIR / "logs"

    # Simulation
    max_ticks_default: int = 1000
    eval_retention_days: int = 30

    cors_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env.local",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def db_config(self) -> dict:
        return {
            "dbname": self.db_name,
            "user": self.db_user,
            "password": self.db_password,
            "host": self.db_host,
            "port": self.db_port,
            "client_encoding": self.db_encoding,
        }


@lru_cache
def get_settings() -> Settings:
    return Settings()