from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import models
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/api/sync", tags=["sync"])


def _parse_since(since: Optional[str]):
    if not since:
        return None
    try:
        return datetime.fromisoformat(since)
    except ValueError:
        return None


@router.get("")
def get_delta(
    since: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """تغییرات از زمان `since` به بعد (فرمت ISO)، فقط برای کاربر جاری. اگر خالی
    باشد، همه‌چیز برمی‌گردد (اولین همگام‌سازی روی یک دستگاه جدید). برای
    کمینه‌کردن حجم داده، فقط رکوردهای تغییریافته (شامل حذف‌شده‌ها به‌صورت
    is_active=false) ارسال می‌شوند.
    """
    since_dt = _parse_since(since)
    server_time = datetime.now(timezone.utc).replace(tzinfo=None)

    tasks_q = db.query(models.Task).filter(models.Task.user_id == current_user.id)
    goals_q = db.query(models.Goal).filter(models.Goal.user_id == current_user.id)
    goal_tasks_q = (
        db.query(models.GoalTask)
        .join(models.Goal, models.Goal.id == models.GoalTask.goal_id)
        .filter(models.Goal.user_id == current_user.id)
    )
    completions_q = db.query(models.TaskCompletion).join(
        models.Task, models.Task.id == models.TaskCompletion.task_id
    ).filter(models.Task.user_id == current_user.id)
    skips_q = db.query(models.TaskSkip).join(
        models.Task, models.Task.id == models.TaskSkip.task_id
    ).filter(models.Task.user_id == current_user.id)

    if since_dt:
        tasks_q = tasks_q.filter(models.Task.updated_at > since_dt)
        goals_q = goals_q.filter(models.Goal.updated_at > since_dt)
        goal_tasks_q = goal_tasks_q.filter(models.GoalTask.updated_at > since_dt)
        completions_q = completions_q.filter(models.TaskCompletion.updated_at > since_dt)
        skips_q = skips_q.filter(models.TaskSkip.date >= since_dt.date())

    return {
        "server_time": server_time.isoformat(),
        "tasks": [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "recurrence_type": t.recurrence_type,
                "recurrence_days": t.recurrence_days,
                "specific_date": t.specific_date.isoformat() if t.specific_date else None,
                "goal_task_id": t.goal_task_id,
                "tag": t.tag,
                "end_date": t.end_date.isoformat() if t.end_date else None,
                "created_at": t.created_at.isoformat() if t.created_at else None,
                "is_active": t.is_active,
                "updated_at": t.updated_at.isoformat() if t.updated_at else None,
            }
            for t in tasks_q.all()
        ],
        "goals": [
            {
                "id": g.id,
                "title": g.title,
                "description": g.description,
                "tag": g.tag,
                "is_active": g.is_active,
                "updated_at": g.updated_at.isoformat() if g.updated_at else None,
            }
            for g in goals_q.all()
        ],
        "goal_tasks": [
            {
                "id": gt.id,
                "goal_id": gt.goal_id,
                "title": gt.title,
                "is_done": gt.is_done,
                "is_active": gt.is_active,
                "updated_at": gt.updated_at.isoformat() if gt.updated_at else None,
            }
            for gt in goal_tasks_q.all()
        ],
        "completions": [
            {
                "id": c.id,
                "task_id": c.task_id,
                "date": c.date.isoformat(),
                "completed": c.completed,
            }
            for c in completions_q.all()
        ],
        "skips": [
            {"id": s.id, "task_id": s.task_id, "date": s.date.isoformat()} for s in skips_q.all()
        ],
    }
