from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.database import close_pool, init_pool
from app.log_config import get_logger
from app.routers import scenarios_router, simulation_router
from app.routers.simulation import cleanup_old_results

log = get_logger(__name__)

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()

    settings.eval_dir.mkdir(parents=True, exist_ok=True)
    settings.xodr_dir.mkdir(parents=True, exist_ok=True)
    settings.log_dir.mkdir(parents=True, exist_ok=True)

    try:
        init_pool()
    except Exception as e:
        log.warning("DB pool init failed (no DB?): %s", e)

    try:
        cleanup_old_results()
    except Exception as e:
        log.warning("Cleanup failed: %s", e)

    yield

    close_pool()


def create_app() -> FastAPI:
    settings = get_settings()

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

    app.mount(
        "/evaluation_outputs",
        StaticFiles(directory=str(settings.eval_dir)),
        name="results",
    )

    app.include_router(simulation_router, prefix="/api", tags=["simulation"])
    app.include_router(scenarios_router, prefix="/api", tags=["scenarios"])

    @app.get("/health")
    async def health():
        from app.database import _db_pool
        return {
            "status": "ok",
            "db": "connected" if _db_pool else "disconnected",
        }

    @app.get("/")
    async def root():
        return {"status": "ok"}

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)