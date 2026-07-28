const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || 'خطا در ارتباط با سرور')
  }
  if (res.status === 204) return null
  return res.json()
}

export function getDailyTasks(date) {
  return request(`/tasks/daily?date=${date}`)
}

export function createTask(payload) {
  return request('/tasks', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateTask(id, payload) {
  return request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export function deleteTask(id) {
  return request(`/tasks/${id}`, { method: 'DELETE' })
}

export function toggleTaskCompletion(id, date) {
  return request(`/tasks/${id}/toggle?date=${date}`, { method: 'POST' })
}
