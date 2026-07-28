from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import Base, engine
from app import models  # noqa: F401 — ensures models are registered before create_all
from app.routers import tasks, goals

Base.metadata.create_all(bind=engine)

# مایگریشن سبک: افزودن ستون‌های جدید به جدول‌های قبلاً موجود بدون از دست دادن داده
with engine.connect() as conn:
    existing_columns = {row[1] for row in conn.execute(text("PRAGMA table_info(tasks)"))}
    if "goal_task_id" not in existing_columns:
        conn.execute(text("ALTER TABLE tasks ADD COLUMN goal_task_id INTEGER"))
        conn.commit()
    if "tag" not in existing_columns:
        conn.execute(text("ALTER TABLE tasks ADD COLUMN tag VARCHAR(30)"))
        conn.commit()
    if "end_date" not in existing_columns:
        conn.execute(text("ALTER TABLE tasks ADD COLUMN end_date DATE"))
        conn.commit()

app = FastAPI(title="TodoApp API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex=r"http://(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}):5173",
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router)
app.include_router(goals.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "سرور در دسترس است"}
