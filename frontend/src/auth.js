import { getServerUrl } from './config'

const TOKEN_KEY = 'spark_auth_token'
const PHONE_KEY = 'spark_auth_phone'

let listeners = []

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getPhone() {
  return localStorage.getItem(PHONE_KEY)
}

export function isLoggedIn() {
  return !!getToken()
}

export function setSession(token, phone) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(PHONE_KEY, phone)
  listeners.forEach((l) => l(true))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(PHONE_KEY)
  listeners.forEach((l) => l(false))
}

export function onAuthChange(cb) {
  listeners.push(cb)
  return () => {
    listeners = listeners.filter((l) => l !== cb)
  }
}

export function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function login(phone, pin) {
  const res = await fetch(`${getServerUrl()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, pin }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.detail || 'ورود ناموفق بود')
  }
  setSession(body.token, body.phone)
  return body
}

export async function logout() {
  const token = getToken()
  clearSession()
  if (token) {
    fetch(`${getServerUrl()}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
  }
}
