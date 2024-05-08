from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
import uvicorn
import carla

from .routers.getters import router as getters_router
from .routers.utils import router as utils_router

@asynccontextmanager
async def lifespan(app: FastAPI):

    carla_client = carla.Client('localhost', 2000)
    app.state.client = carla_client
    app.state.client.set_timeout(20.0)
    yield

    # carla_client

    # client.disconnect()

app = FastAPI(lifespan=lifespan)


app.include_router(getters_router, prefix="/getters", tags=["getters"])
app.include_router(utils_router, prefix="/utils", tags=["utils"])



# @app.get("/")
# def read_root(request: Request):
#     client = request.app.state.client






