from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/api/goals", tags=["goals"])


@router.get("", response_model=list[schemas.GoalOut])
def list_goals(db: Session = Depends(get_db)):
    return db.query(models.Goal).options(joinedload(models.Goal.tasks)).all()


@router.post("", response_model=schemas.GoalOut, status_code=201)
def create_goal(payload: schemas.GoalCreate, db: Session = Depends(get_db)):
    goal = models.Goal(**payload.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.put("/{goal_id}", response_model=schemas.GoalOut)
def update_goal(goal_id: int, payload: schemas.GoalUpdate, db: Session = Depends(get_db)):
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="هدف پیدا نشد")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(goal, key, value)
    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/{goal_id}", status_code=204)
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="هدف پیدا نشد")
    db.delete(goal)
    db.commit()


@router.post("/{goal_id}/tasks", response_model=schemas.GoalTaskOut, status_code=201)
def create_goal_task(goal_id: int, payload: schemas.GoalTaskCreate, db: Session = Depends(get_db)):
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="هدف پیدا نشد")
    task = models.GoalTask(goal_id=goal_id, title=payload.title)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/tasks/{task_id}", response_model=schemas.GoalTaskOut)
def update_goal_task(task_id: int, payload: schemas.GoalTaskUpdate, db: Session = Depends(get_db)):
    task = db.query(models.GoalTask).filter(models.GoalTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="زیرتسک پیدا نشد")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{task_id}", status_code=204)
def delete_goal_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.GoalTask).filter(models.GoalTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="زیرتسک پیدا نشد")
    db.delete(task)
    db.commit()
