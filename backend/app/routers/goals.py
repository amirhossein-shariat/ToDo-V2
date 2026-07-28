from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/api/goals", tags=["goals"])


def _owned_goal(db: Session, goal_id: int, user: models.User) -> models.Goal:
    goal = (
        db.query(models.Goal)
        .filter(models.Goal.id == goal_id, models.Goal.user_id == user.id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="هدف پیدا نشد")
    return goal


def _owned_goal_task(db: Session, task_id: int, user: models.User) -> models.GoalTask:
    task = (
        db.query(models.GoalTask)
        .join(models.Goal, models.Goal.id == models.GoalTask.goal_id)
        .filter(models.GoalTask.id == task_id, models.Goal.user_id == user.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="زیرتسک پیدا نشد")
    return task


@router.get("", response_model=list[schemas.GoalOut])
def list_goals(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    goals = (
        db.query(models.Goal)
        .options(joinedload(models.Goal.tasks))
        .filter(models.Goal.is_active.is_(True), models.Goal.user_id == current_user.id)
        .all()
    )
    for goal in goals:
        goal.tasks = [t for t in goal.tasks if t.is_active]
    return goals


@router.post("", response_model=schemas.GoalOut, status_code=201)
def create_goal(
    payload: schemas.GoalCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    goal = models.Goal(**payload.model_dump(), user_id=current_user.id)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.put("/{goal_id}", response_model=schemas.GoalOut)
def update_goal(
    goal_id: int,
    payload: schemas.GoalUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    goal = _owned_goal(db, goal_id, current_user)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(goal, key, value)
    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/{goal_id}", status_code=204)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    goal = _owned_goal(db, goal_id, current_user)
    goal.is_active = False
    for task in goal.tasks:
        task.is_active = False
    db.commit()


@router.post("/{goal_id}/tasks", response_model=schemas.GoalTaskOut, status_code=201)
def create_goal_task(
    goal_id: int,
    payload: schemas.GoalTaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _owned_goal(db, goal_id, current_user)
    task = models.GoalTask(goal_id=goal_id, title=payload.title)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/tasks/{task_id}", response_model=schemas.GoalTaskOut)
def update_goal_task(
    task_id: int,
    payload: schemas.GoalTaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = _owned_goal_task(db, task_id, current_user)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{task_id}", status_code=204)
def delete_goal_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = _owned_goal_task(db, task_id, current_user)
    task.is_active = False
    db.commit()
