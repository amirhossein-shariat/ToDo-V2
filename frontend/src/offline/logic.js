// پورت جاوااسکریپتیِ منطق backend/app/utils.py برای کار روی کش محلی هنگام آفلاین‌بودن

export function weekDayIndex(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return (d.getDay() + 1) % 7 // شنبه=0 ... جمعه=6 — معادل week_day_index پایتون
}

export function isApplicable(task, dateStr, skipDatesSet) {
  if (task.end_date && dateStr > task.end_date) return false

  let applicable
  if (task.recurrence_type === 'daily') {
    applicable = true
  } else if (task.recurrence_type === 'weekly_days') {
    applicable = (task.recurrence_days || []).includes(weekDayIndex(dateStr))
  } else if (task.recurrence_type === 'once') {
    return task.specific_date === dateStr
  } else {
    return false
  }

  if (applicable && skipDatesSet?.has(`${task.id}_${dateStr}`)) return false
  return applicable
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

export function addDays(dateStr, delta) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + delta)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function computeStreak(task, completedDatesSet, skipDatesSet, todayStr) {
  if (task.recurrence_type !== 'daily' && task.recurrence_type !== 'weekly_days') return 0

  const createdDate = task.created_at ? task.created_at.slice(0, 10) : todayStr
  let d = todayStr
  if (isApplicable(task, d, skipDatesSet) && !completedDatesSet.has(d)) {
    d = addDays(d, -1)
  }

  let streak = 0
  for (let i = 0; i < 730; i += 1) {
    if (d < createdDate) break
    if (isApplicable(task, d, skipDatesSet)) {
      if (completedDatesSet.has(d)) {
        streak += 1
        d = addDays(d, -1)
      } else {
        break
      }
    } else {
      d = addDays(d, -1)
    }
  }
  return streak
}
