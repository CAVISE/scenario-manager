from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
import uvicorn
import carla

from .routers.getters import router as getters_router
from .routers.utils import router as utils_router
from .routers.scenario import router as scenario_router

@asynccontextmanager
async def lifespan(app: FastAPI):

    carla_client = carla.Client('localhost', 2000)\
    #PS> Get-Process -Id (Get-NetTCPConnection -LocalPort 2000).OwningProcess
    app.state.client = carla_client
    app.state.client.set_timeout(3.0)
    yield

    # carla_client

    # client.disconnect()

app = FastAPI(lifespan=lifespan)


app.include_router(getters_router, prefix="/getters", tags=["getters"])
app.include_router(utils_router, prefix="/utils", tags=["utils"])
app.include_router(scenario_router, prefix="/scenario", tags=["scenario"])



# @app.get("/")
# def read_root(request: Request):
#     client = request.app.state.client






