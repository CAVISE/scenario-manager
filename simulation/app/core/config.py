import os


class Config:
    CARLA_HOST: str = os.getenv("CARLA_HOST", "localhost")
    CARLA_PORT: int = int(os.getenv("CARLA_PORT", 2000))

    SPAWN_DELAY = os.getenv("SPAWN_DELAY", 5.0)
    SEED = os.getenv("SEED", 0)  # seed for traffic manager

    REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.getenv("REDIS_PORT", 6369))

    SQLDB_NAME = "db.db"
    SQLDB_TABLE = "reports"


config = Config()
