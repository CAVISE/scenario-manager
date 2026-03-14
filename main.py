from fastapi import FastAPI
from  app.routes import router


from fastapi.middleware.cors import CORSMiddleware




app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api", tags=["v1"])


@app.get("/")
def read_root():
    return "ok"

if __name__ == '__main__':
  import uvicorn
  uvicorn.run(app, host='0.0.0.0', port=8000)
