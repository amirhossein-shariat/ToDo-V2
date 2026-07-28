from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.database import Base, engine
from app import models  # noqa: F401 — ensures models are registered before create_all
from app.routers import tasks, goals, sync, auth

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
    if "updated_at" not in existing_columns:
        conn.execute(text("ALTER TABLE tasks ADD COLUMN updated_at DATETIME"))
        conn.commit()
    if "user_id" not in existing_columns:
        conn.execute(text("ALTER TABLE tasks ADD COLUMN user_id INTEGER"))
        conn.commit()

    goal_columns = {row[1] for row in conn.execute(text("PRAGMA table_info(goals)"))}
    if "tag" not in goal_columns:
        conn.execute(text("ALTER TABLE goals ADD COLUMN tag VARCHAR(30)"))
        conn.commit()
    if "updated_at" not in goal_columns:
        conn.execute(text("ALTER TABLE goals ADD COLUMN updated_at DATETIME"))
        conn.commit()
    if "is_active" not in goal_columns:
        conn.execute(text("ALTER TABLE goals ADD COLUMN is_active BOOLEAN DEFAULT 1"))
        conn.commit()
    if "user_id" not in goal_columns:
        conn.execute(text("ALTER TABLE goals ADD COLUMN user_id INTEGER"))
        conn.commit()

    goal_task_columns = {row[1] for row in conn.execute(text("PRAGMA table_info(goal_tasks)"))}
    if "updated_at" not in goal_task_columns:
        conn.execute(text("ALTER TABLE goal_tasks ADD COLUMN updated_at DATETIME"))
        conn.commit()
    if "is_active" not in goal_task_columns:
        conn.execute(text("ALTER TABLE goal_tasks ADD COLUMN is_active BOOLEAN DEFAULT 1"))
        conn.commit()

    completion_columns = {
        row[1] for row in conn.execute(text("PRAGMA table_info(task_completions)"))
    }
    if "updated_at" not in completion_columns:
        conn.execute(text("ALTER TABLE task_completions ADD COLUMN updated_at DATETIME"))
        conn.commit()

app = FastAPI(title="TodoApp API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex=r"http://(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|100\.\d{1,3}\.\d{1,3}\.\d{1,3}):5173",
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(goals.router)
app.include_router(sync.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "سرور در دسترس است"}


# اگر build فرانت موجود باشد (npm run build)، همان را از همین بک‌اند سرو می‌کنیم
_frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if _frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(_frontend_dist), html=True), name="frontend")
