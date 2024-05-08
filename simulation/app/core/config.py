import os

class Config:

    SPAWN_DELAY = os.getenv("SPAWN_DELAY", 5.0)
    SEED = os.getenv("SEED", 0) #seed for traffic manager

config = Config()