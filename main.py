from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.auth import bootstrap_admin
from app.database import (
    SessionLocal,
    close_database,
    database_is_ready,
    initialize_database,
)
from app.log_config import get_logger
from app.rate_limit import limiter
from app.routers import auth_router, scenarios_router, simulation_router
from app.routers.simulation import cleanup_old_results, recover_persisted_queue

log = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()

    settings.eval_dir.mkdir(parents=True, exist_ok=True)
    settings.xodr_dir.mkdir(parents=True, exist_ok=True)
    settings.log_dir.mkdir(parents=True, exist_ok=True)

    initialize_database()
    with SessionLocal() as session:
        bootstrap_admin(session)

    try:
        cleanup_old_results()
    except Exception as e:
        log.warning("Cleanup failed: %s", e)

    recover_persisted_queue()

    yield

    close_database()


def create_app() -> FastAPI:
    settings = get_settings()
    settings.eval_dir.mkdir(parents=True, exist_ok=True)

    app = FastAPI(
        title="Scenario Manager",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_router, prefix="/api")
    app.include_router(simulation_router, prefix="/api", tags=["simulation"])
    app.include_router(scenarios_router, prefix="/api", tags=["scenarios"])

    @app.get("/health")
    async def health():
        if not database_is_ready():
            raise HTTPException(status_code=503, detail="Database unavailable")
        return {"status": "ok", "db": "connected"}

    @app.get("/")
    async def root():
        return {"status": "ok"}

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
