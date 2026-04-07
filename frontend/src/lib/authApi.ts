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

export type LoginRequestPayload = {
  email: string
  password: string
  twoFactorCode?: string
  recoveryCode?: string
  rememberMachine?: boolean
}

export type LoginResponse = AuthMeResponse | {
  requiresTwoFactor: true
  message: string
}

export type TwoFactorStatus = {
  sharedKey: string
  authenticatorUri: string
  recoveryCodesLeft: number
  recoveryCodes: string[]
  isTwoFactorEnabled: boolean
  isMachineRemembered: boolean
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
  return loginRequestWithMfa({ email, password })
}

export async function loginRequestWithMfa(payload: LoginRequestPayload): Promise<LoginResponse> {
  const res = await authFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email.trim(),
      password: payload.password,
      twoFactorCode: payload.twoFactorCode,
      recoveryCode: payload.recoveryCode,
      rememberMachine: payload.rememberMachine ?? false,
    }),
  })
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Login failed'))
  }
  const body = (await res.json()) as Record<string, unknown>
  if (body.requiresTwoFactor === true) {
    return {
      requiresTwoFactor: true,
      message: typeof body.message === 'string' ? body.message : 'Two-factor authentication code is required.',
    }
  }

  return {
    id: typeof body.id === 'string' ? body.id : '',
    email: typeof body.email === 'string' ? body.email : null,
    fullName: typeof body.fullName === 'string' ? body.fullName : null,
    roles: Array.isArray(body.roles) ? body.roles.filter((item): item is string => typeof item === 'string') : [],
    supporterId: typeof body.supporterId === 'number' ? body.supporterId : null,
    safehouseIds: Array.isArray(body.safehouseIds)
      ? body.safehouseIds.filter((item): item is number => typeof item === 'number')
      : [],
  }
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

export async function fetchTwoFactorStatus(): Promise<TwoFactorStatus> {
  const res = await authFetch('/auth/mfa/status')
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Failed to load MFA settings'))
  }

  return normalizeTwoFactorStatus((await res.json()) as Record<string, unknown>)
}

export async function enableTwoFactor(code: string): Promise<TwoFactorStatus> {
  const res = await authFetch('/auth/mfa/enable', {
    method: 'POST',
    body: JSON.stringify({ code: code.trim() }),
  })
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Failed to enable MFA'))
  }

  return normalizeTwoFactorStatus((await res.json()) as Record<string, unknown>)
}

export async function disableTwoFactor(): Promise<TwoFactorStatus> {
  const res = await authFetch('/auth/mfa/disable', { method: 'POST' })
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Failed to disable MFA'))
  }

  return normalizeTwoFactorStatus((await res.json()) as Record<string, unknown>)
}

export async function resetRecoveryCodes(): Promise<TwoFactorStatus> {
  const res = await authFetch('/auth/mfa/recovery-codes/reset', { method: 'POST' })
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Failed to reset recovery codes'))
  }

  return normalizeTwoFactorStatus((await res.json()) as Record<string, unknown>)
}

async function getErrorMessage(res: Response, fallback: string): Promise<string> {
  let message = `${fallback} (${res.status})`
  try {
    const body = (await res.json()) as { error?: string }
    if (typeof body.error === 'string' && body.error.trim().length > 0) {
      message = body.error
    }
  } catch {
    /* ignore */
  }
  return message
}

function normalizeTwoFactorStatus(body: Record<string, unknown>): TwoFactorStatus {
  return {
    sharedKey: typeof body.sharedKey === 'string' ? body.sharedKey : '',
    authenticatorUri: typeof body.authenticatorUri === 'string' ? body.authenticatorUri : '',
    recoveryCodesLeft: typeof body.recoveryCodesLeft === 'number' ? body.recoveryCodesLeft : 0,
    recoveryCodes: Array.isArray(body.recoveryCodes)
      ? body.recoveryCodes.filter((item): item is string => typeof item === 'string')
      : [],
    isTwoFactorEnabled: body.isTwoFactorEnabled === true,
    isMachineRemembered: body.isMachineRemembered === true,
  }
}
