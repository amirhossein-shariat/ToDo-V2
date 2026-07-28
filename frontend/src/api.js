import { getAll, put, addPendingOp } from './offline/db'
import { runSync } from './offline/sync'
import { isApplicable, computeStreak, addDays } from './offline/logic'

function genTempId(prefix) {
  return `temp-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

async function queueAndSync(op) {
  await addPendingOp(op)
  runSync()
}

// ================= خواندن‌ها از کش محلی (آفلاین-فرست) =================

export async function getDailyTasks(date) {
  const [tasks, completions, skips] = await Promise.all([
    getAll('tasks'),
    getAll('completions'),
    getAll('skips'),
  ])
  const skipSet = new Set(skips.map((s) => `${s.task_id}_${s.date}`))
  const applicable = tasks.filter((t) => t.is_active && isApplicable(t, date, skipSet))
  const today = todayStr()

  return applicable.map((t) => {
    const taskCompletions = completions.filter((c) => c.task_id === t.id && c.completed)
    const completedDates = new Set(taskCompletions.map((c) => c.date))
    return {
      ...t,
      completed: completedDates.has(date),
      streak: computeStreak(t, completedDates, skipSet, today),
    }
  })
}

export async function getRangeSummary(start, end) {
  const [tasks, completions, skips] = await Promise.all([
    getAll('tasks'),
    getAll('completions'),
    getAll('skips'),
  ])
  const activeTasks = tasks.filter((t) => t.is_active)
  const skipSet = new Set(skips.map((s) => `${s.task_id}_${s.date}`))

  const completedByDate = {}
  for (const c of completions) {
    if (!c.completed) continue
    if (!completedByDate[c.date]) completedByDate[c.date] = new Set()
    completedByDate[c.date].add(c.task_id)
  }

  const result = []
  let cur = start
  while (cur <= end) {
    const applicable = activeTasks.filter((t) => isApplicable(t, cur, skipSet))
    const doneSet = completedByDate[cur] || new Set()
    const done = applicable.filter((t) => doneSet.has(t.id)).length
    result.push({ date: cur, total: applicable.length, done })
    cur = addDays(cur, 1)
  }
  return result
}

export async function getGoals() {
  const [goals, goalTasks] = await Promise.all([getAll('goals'), getAll('goal_tasks')])
  return goals
    .filter((g) => g.is_active)
    .map((g) => ({
      ...g,
      tasks: goalTasks.filter((gt) => gt.goal_id === g.id && gt.is_active),
    }))
}

export async function getTaskStreaks() {
  const [tasks, completions, skips] = await Promise.all([
    getAll('tasks'),
    getAll('completions'),
    getAll('skips'),
  ])
  const skipSet = new Set(skips.map((s) => `${s.task_id}_${s.date}`))
  const today = todayStr()
  const recurring = tasks.filter(
    (t) => t.is_active && (t.recurrence_type === 'daily' || t.recurrence_type === 'weekly_days'),
  )

  return recurring.map((t) => {
    const completedDates = new Set(
      completions.filter((c) => c.task_id === t.id && c.completed).map((c) => c.date),
    )
    return { id: t.id, title: t.title, streak: computeStreak(t, completedDates, skipSet, today) }
  })
}

export async function getTagStats(start, end) {
  const [tasks, completions] = await Promise.all([getAll('tasks'), getAll('completions')])
  const tagByTaskId = new Map(tasks.map((t) => [t.id, t.tag]))

  const counts = new Map()
  for (const c of completions) {
    if (!c.completed) continue
    if (c.date < start || c.date > end) continue
    const tag = tagByTaskId.get(c.task_id) ?? null
    counts.set(tag, (counts.get(tag) || 0) + 1)
  }

  return Array.from(counts.entries()).map(([tag, count]) => ({ tag, count }))
}

// ================= نوشتن‌ها: اول کش محلی (خوش‌بینانه) + صف‌شدن برای سینک =================

export async function createTask(payload) {
  const tempId = genTempId('task')
  const localTask = { ...payload, id: tempId, is_active: true, created_at: new Date().toISOString() }
  await put('tasks', localTask)
  await queueAndSync({ method: 'POST', url: '/tasks', body: payload, store: 'tasks', tempId })
  return localTask
}

export async function updateTask(id, payload) {
  const tasks = await getAll('tasks')
  const existing = tasks.find((t) => t.id === id)
  const updated = { ...existing, ...payload }
  if (existing) await put('tasks', updated)
  await queueAndSync({ method: 'PUT', url: `/tasks/${id}`, body: payload })
  return updated
}

export async function deleteTask(id) {
  const tasks = await getAll('tasks')
  const existing = tasks.find((t) => t.id === id)
  if (existing) await put('tasks', { ...existing, is_active: false })
  await queueAndSync({ method: 'DELETE', url: `/tasks/${id}` })
}

export async function deleteTaskOccurrence(id, date) {
  const skips = await getAll('skips')
  if (!skips.some((s) => s.task_id === id && s.date === date)) {
    await put('skips', { id: genTempId('skip'), task_id: id, date })
  }
  const completions = await getAll('completions')
  const existing = completions.find((c) => c.task_id === id && c.date === date)
  if (existing) await put('completions', { ...existing, completed: false })
  await queueAndSync({ method: 'DELETE', url: `/tasks/${id}/occurrence?date=${date}` })
}

export async function toggleTaskCompletion(id, date) {
  const completions = await getAll('completions')
  const existing = completions.find((c) => c.task_id === id && c.date === date)
  const completed = existing ? !existing.completed : true
  if (existing) await put('completions', { ...existing, completed })
  else await put('completions', { id: genTempId('comp'), task_id: id, date, completed })
  await queueAndSync({ method: 'POST', url: `/tasks/${id}/toggle?date=${date}` })
  return { completed }
}

export async function createGoal(payload) {
  const tempId = genTempId('goal')
  const localGoal = { ...payload, id: tempId, is_active: true }
  await put('goals', localGoal)
  await queueAndSync({ method: 'POST', url: '/goals', body: payload, store: 'goals', tempId })
  return localGoal
}

export async function updateGoal(id, payload) {
  const goals = await getAll('goals')
  const existing = goals.find((g) => g.id === id)
  const updated = { ...existing, ...payload }
  if (existing) await put('goals', updated)
  await queueAndSync({ method: 'PUT', url: `/goals/${id}`, body: payload })
  return updated
}

export async function deleteGoal(id) {
  const goals = await getAll('goals')
  const existing = goals.find((g) => g.id === id)
  if (existing) await put('goals', { ...existing, is_active: false })
  const goalTasks = await getAll('goal_tasks')
  for (const gt of goalTasks.filter((t) => t.goal_id === id)) {
    await put('goal_tasks', { ...gt, is_active: false })
  }
  await queueAndSync({ method: 'DELETE', url: `/goals/${id}` })
}

export async function createGoalTask(goalId, title) {
  const tempId = genTempId('goaltask')
  const localTask = { id: tempId, goal_id: goalId, title, is_done: false, is_active: true }
  await put('goal_tasks', localTask)
  await queueAndSync({
    method: 'POST',
    url: `/goals/${goalId}/tasks`,
    body: { title },
    store: 'goal_tasks',
    tempId,
  })
  return localTask
}

export async function updateGoalTask(taskId, payload) {
  const goalTasks = await getAll('goal_tasks')
  const existing = goalTasks.find((t) => t.id === taskId)
  const updated = { ...existing, ...payload }
  if (existing) await put('goal_tasks', updated)
  await queueAndSync({ method: 'PUT', url: `/goals/tasks/${taskId}`, body: payload })
  return updated
}

export async function deleteGoalTask(taskId) {
  const goalTasks = await getAll('goal_tasks')
  const existing = goalTasks.find((t) => t.id === taskId)
  if (existing) await put('goal_tasks', { ...existing, is_active: false })
  await queueAndSync({ method: 'DELETE', url: `/goals/tasks/${taskId}` })
}
