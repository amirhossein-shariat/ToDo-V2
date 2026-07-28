from datetime import date as date_type
from typing import List, Literal, Optional

from pydantic import BaseModel, field_validator

RecurrenceType = Literal["once", "daily", "weekly_days"]

TAGS = ["کاری", "آموزشی", "شخصی", "سلامتی", "خانه", "مالی", "سرگرمی", "اجتماعی"]


def _check_tag(v):
    if v is not None and v not in TAGS:
        raise ValueError(f"برچسب نامعتبر است. برچسب‌های مجاز: {', '.join(TAGS)}")
    return v


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    recurrence_type: RecurrenceType
    recurrence_days: Optional[List[int]] = None
    specific_date: Optional[date_type] = None
    tag: Optional[str] = None
    end_date: Optional[date_type] = None

    @field_validator("tag")
    @classmethod
    def validate_tag(cls, v):
        return _check_tag(v)

    @field_validator("recurrence_days")
    @classmethod
    def validate_days(cls, v, info):
        if info.data.get("recurrence_type") == "weekly_days":
            if not v:
                raise ValueError("برای تکرار در روزهای مشخص، حداقل یک روز را انتخاب کنید")
            if any(d < 0 or d > 6 for d in v):
                raise ValueError("روزها باید بین 0 تا 6 باشند")
        return v

    @field_validator("specific_date")
    @classmethod
    def validate_specific_date(cls, v, info):
        if info.data.get("recurrence_type") == "once" and v is None:
            raise ValueError("برای تسک یک‌بارمصرف، تاریخ الزامی است")
        return v


class TaskCreate(TaskBase):
    goal_task_id: Optional[int] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    recurrence_type: Optional[RecurrenceType] = None
    recurrence_days: Optional[List[int]] = None
    specific_date: Optional[date_type] = None
    tag: Optional[str] = None
    end_date: Optional[date_type] = None
    is_active: Optional[bool] = None


class TaskOut(TaskBase):
    id: int
    is_active: bool
    goal_task_id: Optional[int] = None

    class Config:
        from_attributes = True


class DailyTaskOut(TaskOut):
    completed: bool
    streak: int = 0


class DaySummary(BaseModel):
    date: date_type
    total: int
    done: int


class GoalTaskCreate(BaseModel):
    title: str


class GoalTaskUpdate(BaseModel):
    title: Optional[str] = None
    is_done: Optional[bool] = None


class GoalTaskOut(BaseModel):
    id: int
    goal_id: int
    title: str
    is_done: bool

    class Config:
        from_attributes = True


class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    tag: Optional[str] = None

    @field_validator("tag")
    @classmethod
    def validate_tag(cls, v):
        return _check_tag(v)


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tag: Optional[str] = None

    @field_validator("tag")
    @classmethod
    def validate_tag(cls, v):
        return _check_tag(v)


class TagStat(BaseModel):
    tag: Optional[str]
    count: int


class TaskStreakOut(BaseModel):
    id: int
    title: str
    streak: int


class GoalOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    tag: Optional[str] = None
    tasks: List[GoalTaskOut] = []

    class Config:
        from_attributes = True
