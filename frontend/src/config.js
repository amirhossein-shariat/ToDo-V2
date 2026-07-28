const KEY = 'spark_server_url'

export function getServerUrl() {
  return localStorage.getItem(KEY) || import.meta.env.VITE_API_BASE || ''
}

export function setServerUrl(url) {
  const clean = (url || '').trim().replace(/\/$/, '')
  if (clean) localStorage.setItem(KEY, clean)
  else localStorage.removeItem(KEY)
}
