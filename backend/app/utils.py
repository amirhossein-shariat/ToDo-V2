from datetime import date


def week_day_index(d: date) -> int:
    """0=شنبه, 1=یکشنبه, 2=دوشنبه, 3=سه‌شنبه, 4=چهارشنبه, 5=پنجشنبه, 6=جمعه"""
    return (d.weekday() + 2) % 7
