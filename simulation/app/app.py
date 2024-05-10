from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware
import uvicorn
import carla

from .routers.getters import router as getters_router
from .routers.utils import router as utils_router
from .routers.scenario import router as scenario_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    carla_client = carla.Client("localhost", 2000)
    # PS> Get-Process -Id (Get-NetTCPConnection -LocalPort 2000).OwningProcess
    # .\CarlaUE4.exe -quality-level=Low
    app.state.client = carla_client
    app.state.client.set_timeout(3.0)
    yield

    # carla_client

    # client.disconnect()


app = FastAPI(lifespan=lifespan)


app.include_router(getters_router, prefix="/getters", tags=["getters"])
app.include_router(utils_router, prefix="/utils", tags=["utils"])
app.include_router(scenario_router, prefix="/scenario", tags=["scenario"])

#cors allow all
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def react_app():
    """
    return static builded react app in current folder with index.html style.css and scripts.js
    """


# @app.get("/")
# def read_root(request: Request):
#     client = request.app.state.client
