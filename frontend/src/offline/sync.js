import { getAll, put, remove, getPendingOps, removePendingOp, getMeta, setMeta } from './db'
import { authHeaders, clearSession, isLoggedIn } from '../auth'
import { getServerUrl } from '../config'

let syncing = false
let listeners = []

export function onSyncStatus(cb) {
  listeners.push(cb)
  return () => {
    listeners = listeners.filter((l) => l !== cb)
  }
}

function notify(status) {
  listeners.forEach((l) => l(status))
}

async function rawRequest(url, options = {}) {
  const res = await fetch(`${getServerUrl()}/api${url}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    ...options,
  })
  if (res.status === 401) {
    clearSession()
    notify('unauthorized')
    throw new Error('unauthorized')
  }
  if (!res.ok) throw new Error('network')
  if (res.status === 204) return null
  return res.json()
}

async function pushPending() {
  const ops = await getPendingOps()
  for (const op of ops) {
    try {
      await rawRequest(op.url, {
        method: op.method,
        body: op.body !== undefined ? JSON.stringify(op.body) : undefined,
      })
      if (op.store && op.tempId) {
        await remove(op.store, op.tempId)
      }
      await removePendingOp(op.id)
    } catch {
      // آفلاین یا خطای شبکه — بقیهٔ صف برای تلاش بعدی باقی می‌ماند
      return false
    }
  }
  return true
}

async function pullDelta() {
  const since = await getMeta('lastSync')
  const data = await rawRequest(`/sync${since ? `?since=${encodeURIComponent(since)}` : ''}`)

  for (const t of data.tasks) {
    if (t.is_active) await put('tasks', t)
    else await remove('tasks', t.id)
  }
  for (const g of data.goals) {
    if (g.is_active) await put('goals', g)
    else await remove('goals', g.id)
  }
  for (const gt of data.goal_tasks) {
    if (gt.is_active) await put('goal_tasks', gt)
    else await remove('goal_tasks', gt.id)
  }
  for (const c of data.completions) await put('completions', c)
  for (const s of data.skips) await put('skips', s)

  await setMeta('lastSync', data.server_time)
}

export async function runSync() {
  if (!isLoggedIn()) return
  if (syncing || (typeof navigator !== 'undefined' && !navigator.onLine)) return
  syncing = true
  notify('syncing')
  try {
    const pushedAll = await pushPending()
    await pullDelta()
    notify(pushedAll ? 'synced' : 'partial')
  } catch {
    notify('error')
  } finally {
    syncing = false
  }
}

export function initSync() {
  runSync()
  window.addEventListener('online', runSync)
  window.addEventListener('offline', () => notify('offline'))
  setInterval(runSync, 30000)
}

export async function pendingCount() {
  return (await getPendingOps()).length
}
