from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    # 'once' | 'daily' | 'weekly_days'
    recurrence_type = Column(String(20), nullable=False, default="once")
    # for recurrence_type == 'weekly_days': list of ints 0-6 (شنبه=0 ... جمعه=6)
    recurrence_days = Column(JSON, nullable=True)
    # for recurrence_type == 'once'
    specific_date = Column(Date, nullable=True)

    # اگر این تسک از یک زیرتسک هدف ساخته شده باشد
    goal_task_id = Column(Integer, ForeignKey("goal_tasks.id"), nullable=True)

    # برچسب ثابت (کاری، آموزشی و ...)
    tag = Column(String(30), nullable=True)
    # تاریخ پایان تکرار برای daily/weekly_days — null یعنی نامحدود
    end_date = Column(Date, nullable=True)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    completions = relationship(
        "TaskCompletion", back_populates="task", cascade="all, delete-orphan"
    )
    skips = relationship(
        "TaskSkip", back_populates="task", cascade="all, delete-orphan"
    )


class TaskCompletion(Base):
    __tablename__ = "task_completions"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    completed = Column(Boolean, default=True)
    completed_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="completions")


class TaskSkip(Base):
    """روزی که یک تسک تکرارشونده صرفاً برای همان روز حذف/رد شده است."""

    __tablename__ = "task_skips"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)

    task = relationship("Task", back_populates="skips")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tasks = relationship(
        "GoalTask", back_populates="goal", cascade="all, delete-orphan"
    )


class GoalTask(Base):
    __tablename__ = "goal_tasks"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=False)
    title = Column(String(200), nullable=False)
    is_done = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    goal = relationship("Goal", back_populates="tasks")
