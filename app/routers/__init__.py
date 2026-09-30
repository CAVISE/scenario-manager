from app.routers.auth import router as auth_router
from app.routers.scenarios import router as scenarios_router
from app.routers.simulation import router as simulation_router

__all__ = ["auth_router", "scenarios_router", "simulation_router"]
