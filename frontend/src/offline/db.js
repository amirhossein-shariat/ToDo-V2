import { openDB } from 'idb'

const DB_NAME = 'spark-offline'
const DB_VERSION = 1

export const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('tasks')) db.createObjectStore('tasks', { keyPath: 'id' })
    if (!db.objectStoreNames.contains('goals')) db.createObjectStore('goals', { keyPath: 'id' })
    if (!db.objectStoreNames.contains('goal_tasks'))
      db.createObjectStore('goal_tasks', { keyPath: 'id' })
    if (!db.objectStoreNames.contains('completions'))
      db.createObjectStore('completions', { keyPath: 'id' })
    if (!db.objectStoreNames.contains('skips')) db.createObjectStore('skips', { keyPath: 'id' })
    if (!db.objectStoreNames.contains('pending_ops'))
      db.createObjectStore('pending_ops', { keyPath: 'id', autoIncrement: true })
    if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' })
  },
})

export async function getAll(store) {
  return (await dbPromise).getAll(store)
}

export async function putAll(store, items) {
  const db = await dbPromise
  const tx = db.transaction(store, 'readwrite')
  await Promise.all(items.map((item) => tx.store.put(item)))
  await tx.done
}

export async function put(store, item) {
  return (await dbPromise).put(store, item)
}

export async function remove(store, key) {
  return (await dbPromise).delete(store, key)
}

export async function getMeta(key) {
  const row = await (await dbPromise).get('meta', key)
  return row?.value
}

export async function setMeta(key, value) {
  return (await dbPromise).put('meta', { key, value })
}

export async function addPendingOp(op) {
  return (await dbPromise).add('pending_ops', { ...op, createdAt: Date.now() })
}

export async function getPendingOps() {
  return (await dbPromise).getAll('pending_ops')
}

export async function removePendingOp(id) {
  return (await dbPromise).delete('pending_ops', id)
}

const ALL_STORES = ['tasks', 'goals', 'goal_tasks', 'completions', 'skips', 'pending_ops', 'meta']

export async function clearAllData() {
  const db = await dbPromise
  await Promise.all(ALL_STORES.map((store) => db.clear(store)))
}
