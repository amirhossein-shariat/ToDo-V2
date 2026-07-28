from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app import models  # noqa: F401 — ensures models are registered before create_all
from app.routers import tasks

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TodoApp API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "سرور در دسترس است"}
