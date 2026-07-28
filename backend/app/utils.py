from datetime import date, timedelta


def week_day_index(d: date) -> int:
    """0=شنبه, 1=یکشنبه, 2=دوشنبه, 3=سه‌شنبه, 4=چهارشنبه, 5=پنجشنبه, 6=جمعه"""
    return (d.weekday() + 2) % 7


def _is_applicable(task, d: date) -> bool:
    if task.recurrence_type == "daily":
        return True
    if task.recurrence_type == "weekly_days":
        return week_day_index(d) in (task.recurrence_days or [])
    return False


def compute_streak(task, completed_dates: set, today: date) -> int:
    """تعداد روزهای متوالیِ انجام‌شدهٔ یک تسک تکرارشونده تا امروز.

    اگر امروز هنوز انجام نشده باشد، بدون صفر کردن رشته، شمارش از دیروز آغاز می‌شود
    (مشابه رفتار معمول اپ‌های عادت‌سازی).
    """
    if task.recurrence_type not in ("daily", "weekly_days"):
        return 0

    created_date = task.created_at.date() if task.created_at else today
    d = today
    if _is_applicable(task, d) and d not in completed_dates:
        d -= timedelta(days=1)

    streak = 0
    for _ in range(730):
        if d < created_date:
            break
        if _is_applicable(task, d):
            if d in completed_dates:
                streak += 1
                d -= timedelta(days=1)
            else:
                break
        else:
            d -= timedelta(days=1)
    return streak
