from functools import lru_cache
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).parent.parent
ENV_FILE = BASE_DIR / ".env"

load_dotenv(ENV_FILE, override=True)


class Settings(BaseSettings):
    # CARLA
    carla_host: str
    carla_port: int = Field(ge=1, le=65535)
    carla_timeout_seconds: float = Field(gt=0)

    db_name: str
    db_user: str
    db_password: str
    db_host: Literal["db"]
    db_port: int
    db_encoding: str

    base_dir: Path = BASE_DIR
    xodr_dir: Path = BASE_DIR / "assets" / "xodrs"
    eval_dir: Path = BASE_DIR / "evaluation_outputs"
    log_dir: Path = BASE_DIR / "logs"

    # Simulation
    max_ticks_default: int = 1000
    eval_retention_days: int = 30

    cors_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

@lru_cache
def get_settings() -> Settings:
    return Settings()
