import { getApiBaseUrl } from './api'

/** User payload when signed in (from GET /auth/me after checking authenticated). */
export type AuthMeResponse = {
  id: string
  email: string | null
  fullName: string | null
  roles: string[]
  supporterId: number | null
  safehouseIds: number[]
}

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = getApiBaseUrl()
  const headers: HeadersInit = {
    Accept: 'application/json',
    ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    ...((init?.headers as Record<string, string>) ?? {}),
  }
  return fetch(`${base}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  })
}

export async function loginRequest(email: string, password: string): Promise<unknown> {
  const res = await authFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), password }),
  })
  if (!res.ok) {
    let message = `Login failed (${res.status})`
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) {
        message = body.error
      }
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  return res.json()
}

/** Returns the signed-in user, or null if there is no session (200 + authenticated: false). */
export async function fetchMe(): Promise<AuthMeResponse | null> {
  const res = await authFetch('/auth/me')
  if (!res.ok) {
    throw new Error(`Session check failed (${res.status})`)
  }
  const data = (await res.json()) as { authenticated: boolean } & Partial<AuthMeResponse>
  if (!data.authenticated) {
    return null
  }
  return {
    id: data.id ?? '',
    email: data.email ?? null,
    fullName: data.fullName ?? null,
    roles: data.roles ?? [],
    supporterId: data.supporterId ?? null,
    safehouseIds: data.safehouseIds ?? [],
  }
}

export async function logoutRequest(): Promise<void> {
  const res = await authFetch('/auth/logout', { method: 'POST' })
  if (!res.ok && res.status !== 401) {
    throw new Error(`Logout failed (${res.status})`)
  }
}
