from functools import lru_cache
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).parent.parent
ENV_FILE = BASE_DIR / ".env"

load_dotenv(ENV_FILE, override=True)


class Settings(BaseSettings):
    app_environment: Literal["development", "production"] = "development"
    auth_jwt_secret: SecretStr | None = None
    auth_bootstrap_admin_email: str | None = None
    auth_bootstrap_admin_password: SecretStr | None = None
    auth_access_token_expire_minutes: int = Field(default=60, ge=5, le=1440)

    carla_host: str
    carla_port: int = Field(ge=1, le=65535)
    carla_traffic_manager_port: int = Field(default=8001, ge=1, le=65535)
    carla_timeout_seconds: float = Field(gt=0)
    carla_setup_timeout_seconds: float = Field(default=90.0, gt=0)

    db_name: str
    db_user: str
    db_password: str
    db_host: str
    db_port: int
    db_encoding: str

    base_dir: Path = BASE_DIR
    xodr_dir: Path = BASE_DIR / "assets" / "xodrs"
    eval_dir: Path = BASE_DIR / "evaluation_outputs"
    log_dir: Path = BASE_DIR / "logs"

    max_ticks_default: int = 3000
    eval_retention_days: int = 30
    simulation_max_runtime_seconds: float = Field(default=7200.0, gt=0)
    simulation_stop_grace_seconds: float = Field(default=20.0, gt=0)

    cors_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(extra="ignore")

    @field_validator("auth_jwt_secret", "auth_bootstrap_admin_password", mode="before")
    @classmethod
    def normalize_secret(cls, value: object) -> object:
        if value is None:
            return None
        normalized = str(value).strip()
        return normalized or None

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        if self.app_environment == "production" and self.auth_jwt_secret is None:
            raise ValueError("AUTH_JWT_SECRET must be configured in production")
        if (
            self.app_environment == "production"
            and len(self.auth_jwt_secret.get_secret_value()) < 32
        ):
            raise ValueError("AUTH_JWT_SECRET must contain at least 32 characters")
        if self.app_environment == "production" and not self.auth_bootstrap_admin_email:
            raise ValueError(
                "AUTH_BOOTSTRAP_ADMIN_EMAIL must be configured in production"
            )
        if (
            self.app_environment == "production"
            and self.auth_bootstrap_admin_password is None
        ):
            raise ValueError(
                "AUTH_BOOTSTRAP_ADMIN_PASSWORD must be configured in production"
            )
        if (
            self.app_environment == "production"
            and len(self.auth_bootstrap_admin_password.get_secret_value()) < 12
        ):
            raise ValueError(
                "AUTH_BOOTSTRAP_ADMIN_PASSWORD must contain at least 12 characters"
            )
        if self.app_environment == "production" and "*" in self.cors_origins_list:
            raise ValueError("CORS_ORIGINS cannot contain '*' in production")
        return self

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()
