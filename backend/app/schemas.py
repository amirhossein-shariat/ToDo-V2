from datetime import date as date_type
from typing import List, Literal, Optional

from pydantic import BaseModel, field_validator

RecurrenceType = Literal["once", "daily", "weekly_days"]


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    recurrence_type: RecurrenceType
    recurrence_days: Optional[List[int]] = None
    specific_date: Optional[date_type] = None

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
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    recurrence_type: Optional[RecurrenceType] = None
    recurrence_days: Optional[List[int]] = None
    specific_date: Optional[date_type] = None
    is_active: Optional[bool] = None


class TaskOut(TaskBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


class DailyTaskOut(TaskOut):
    completed: bool
