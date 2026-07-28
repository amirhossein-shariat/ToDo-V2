from datetime import date as date_type, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.utils import week_day_index

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def _applicable_tasks(tasks, target_date: date_type):
    idx = week_day_index(target_date)
    result = []
    for task in tasks:
        if task.recurrence_type == "daily":
            result.append(task)
        elif task.recurrence_type == "weekly_days" and idx in (task.recurrence_days or []):
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

    return [
        schemas.DailyTaskOut(
            id=t.id,
            title=t.title,
            description=t.description,
            recurrence_type=t.recurrence_type,
            recurrence_days=t.recurrence_days,
            specific_date=t.specific_date,
            is_active=t.is_active,
            completed=t.id in completions,
        )
        for t in applicable
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

    return schemas.DailyTaskOut(
        id=task.id,
        title=task.title,
        description=task.description,
        recurrence_type=task.recurrence_type,
        recurrence_days=task.recurrence_days,
        specific_date=task.specific_date,
        is_active=task.is_active,
        completed=completed,
    )
