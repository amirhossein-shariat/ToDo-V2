from datetime import date as date_type, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.utils import compute_streak, is_applicable

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def _applicable_tasks(tasks, target_date: date_type):
    result = []
    for task in tasks:
        if task.recurrence_type in ("daily", "weekly_days"):
            if is_applicable(task, target_date):
                result.append(task)
        elif task.recurrence_type == "once" and task.specific_date == target_date:
            result.append(task)
    return result


@router.get("", response_model=list[schemas.TaskOut])
def list_tasks(db: Session = Depends(get_db)):
    return db.query(models.Task).filter(models.Task.is_active.is_(True)).all()


@router.get("/daily", response_model=list[schemas.DailyTaskOut])
def list_daily_tasks(date: date_type = Query(...), db: Session = Depends(get_db)):
    tasks = db.query(models.Task).filter(models.Task.is_active.is_(True)).all()
    applicable = _applicable_tasks(tasks, date)

    completions = {
        c.task_id
        for c in db.query(models.TaskCompletion).filter(
            models.TaskCompletion.date == date,
            models.TaskCompletion.completed.is_(True),
        )
    }

    completions_by_task = {}
    if applicable:
        for row in db.query(models.TaskCompletion.task_id, models.TaskCompletion.date).filter(
            models.TaskCompletion.task_id.in_([t.id for t in applicable]),
            models.TaskCompletion.completed.is_(True),
        ):
            completions_by_task.setdefault(row.task_id, set()).add(row.date)

    today = date_type.today()

    return [
        schemas.DailyTaskOut(
            id=t.id,
            title=t.title,
            description=t.description,
            recurrence_type=t.recurrence_type,
            recurrence_days=t.recurrence_days,
            specific_date=t.specific_date,
            tag=t.tag,
            end_date=t.end_date,
            is_active=t.is_active,
            goal_task_id=t.goal_task_id,
            completed=t.id in completions,
            streak=compute_streak(t, completions_by_task.get(t.id, set()), today),
        )
        for t in applicable
    ]


@router.get("/streaks", response_model=list[schemas.TaskStreakOut])
def list_streaks(db: Session = Depends(get_db)):
    tasks = (
        db.query(models.Task)
        .filter(models.Task.is_active.is_(True), models.Task.recurrence_type.in_(["daily", "weekly_days"]))
        .all()
    )
    completions_by_task = {}
    if tasks:
        for row in db.query(models.TaskCompletion.task_id, models.TaskCompletion.date).filter(
            models.TaskCompletion.task_id.in_([t.id for t in tasks]),
            models.TaskCompletion.completed.is_(True),
        ):
            completions_by_task.setdefault(row.task_id, set()).add(row.date)

    today = date_type.today()
    return [
        schemas.TaskStreakOut(
            id=t.id,
            title=t.title,
            streak=compute_streak(t, completions_by_task.get(t.id, set()), today),
        )
        for t in tasks
    ]


@router.get("/range", response_model=list[schemas.DaySummary])
def list_range_summary(
    start: date_type = Query(...), end: date_type = Query(...), db: Session = Depends(get_db)
):
    if end < start:
        raise HTTPException(status_code=400, detail="تاریخ پایان نمی‌تواند قبل از شروع باشد")

    tasks = db.query(models.Task).filter(models.Task.is_active.is_(True)).all()

    completed_counts = {}
    for row in (
        db.query(models.TaskCompletion.date, models.TaskCompletion.task_id)
        .filter(
            models.TaskCompletion.date >= start,
            models.TaskCompletion.date <= end,
            models.TaskCompletion.completed.is_(True),
        )
        .all()
    ):
        completed_counts.setdefault(row.date, set()).add(row.task_id)

    summaries = []
    current = start
    while current <= end:
        applicable = _applicable_tasks(tasks, current)
        done_ids = completed_counts.get(current, set())
        done = sum(1 for t in applicable if t.id in done_ids)
        summaries.append(schemas.DaySummary(date=current, total=len(applicable), done=done))
        current += timedelta(days=1)

    return summaries


@router.get("/tag-stats", response_model=list[schemas.TagStat])
def tag_stats(
    start: date_type = Query(...), end: date_type = Query(...), db: Session = Depends(get_db)
):
    if end < start:
        raise HTTPException(status_code=400, detail="تاریخ پایان نمی‌تواند قبل از شروع باشد")

    rows = (
        db.query(models.Task.tag, models.TaskCompletion.task_id)
        .join(models.TaskCompletion, models.TaskCompletion.task_id == models.Task.id)
        .filter(
            models.TaskCompletion.date >= start,
            models.TaskCompletion.date <= end,
            models.TaskCompletion.completed.is_(True),
        )
        .all()
    )

    counts: dict = {}
    for tag, _task_id in rows:
        counts[tag] = counts.get(tag, 0) + 1

    return [schemas.TagStat(tag=tag, count=count) for tag, count in counts.items()]


@router.post("", response_model=schemas.TaskOut, status_code=201)
def create_task(payload: schemas.TaskCreate, db: Session = Depends(get_db)):
    task = models.Task(**payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/{task_id}", response_model=schemas.TaskOut)
def update_task(task_id: int, payload: schemas.TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="تسک پیدا نشد")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="تسک پیدا نشد")
    db.delete(task)
    db.commit()


@router.delete("/{task_id}/occurrence", status_code=204)
def delete_task_occurrence(
    task_id: int, date: date_type = Query(...), db: Session = Depends(get_db)
):
    """حذف یک تسک تکرارشونده فقط برای یک روز مشخص (بدون تأثیر روی روزهای دیگر)."""
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="تسک پیدا نشد")

    db.query(models.TaskCompletion).filter(
        models.TaskCompletion.task_id == task_id, models.TaskCompletion.date == date
    ).delete()

    exists = (
        db.query(models.TaskSkip)
        .filter(models.TaskSkip.task_id == task_id, models.TaskSkip.date == date)
        .first()
    )
    if not exists:
        db.add(models.TaskSkip(task_id=task_id, date=date))

    db.commit()


@router.post("/{task_id}/toggle", response_model=schemas.DailyTaskOut)
def toggle_completion(task_id: int, date: date_type = Query(...), db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="تسک پیدا نشد")

    completion = (
        db.query(models.TaskCompletion)
        .filter(models.TaskCompletion.task_id == task_id, models.TaskCompletion.date == date)
        .first()
    )

    if completion:
        db.delete(completion)
        completed = False
    else:
        db.add(models.TaskCompletion(task_id=task_id, date=date, completed=True))
        completed = True

    db.commit()

    completed_dates = {
        c.date
        for c in db.query(models.TaskCompletion).filter(
            models.TaskCompletion.task_id == task_id,
            models.TaskCompletion.completed.is_(True),
        )
    }

    return schemas.DailyTaskOut(
        id=task.id,
        title=task.title,
        description=task.description,
        recurrence_type=task.recurrence_type,
        recurrence_days=task.recurrence_days,
        specific_date=task.specific_date,
        tag=task.tag,
        end_date=task.end_date,
        is_active=task.is_active,
        goal_task_id=task.goal_task_id,
        completed=completed,
        streak=compute_streak(task, completed_dates, date_type.today()),
    )
