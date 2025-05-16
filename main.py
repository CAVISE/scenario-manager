from fastapi import FastAPI
from .app.routes import router

app = FastAPI()


app.include_router(router, prefix="/api", tags=["v1"])


@app.get("/")
def read_root():
    return "ok"

