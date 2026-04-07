import { useCallback, useEffect, useState } from 'react'

/**
 * Default to same-origin /api in both development and production.
 * - Development: Vite proxies /api to http://localhost:4000
 * - Production: Vercel rewrites /api/* to the Azure backend so auth cookies stay first-party
 * Override with VITE_API_BASE_URL only when you intentionally want a different origin.
 */
function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim()

  if (configured && configured.length > 0) {
    return configured.replace(/\/$/, '')
  }

  return '/api'
}

type ResourceState<T> = {
  data: T
  isLoading: boolean
  error: string | null
  source: 'live' | 'fallback'
}

export function getApiBaseUrl() {
  return resolveApiBaseUrl()
}

function asErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }
  return 'Request failed.'
}

function toFriendlyNetworkError(path: string, error: unknown): Error {
  const original = asErrorMessage(error)
  return new Error(
    `Could not reach the API for ${path}. Verify API URL, CORS, and cookie settings. (${original})`,
  )
}

async function parseJsonBody<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!text) {
    return undefined as T
  }
  return JSON.parse(text) as T
}

function statusFallbackMessage(status: number): string {
  if (status === 401) return 'Not authenticated. Sign in again and retry.'
  if (status === 403) return 'Access denied for this action.'
  return `Request failed with status ${status}`
}

export async function fetchJson<T>(path: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      credentials: 'include',
      mode: 'cors',
      headers: {
        Accept: 'application/json',
      },
    })
  } catch (error) {
    throw toFriendlyNetworkError(path, error)
  }

  if (!response.ok) {
    throw new Error(statusFallbackMessage(response.status))
  }

  return parseJsonBody<T>(response)
}

/** Authenticated JSON request (POST / PUT / DELETE). */
export async function sendJson<T>(path: string, method: string, body?: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      credentials: 'include',
      mode: 'cors',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    throw toFriendlyNetworkError(path, error)
  }

  if (response.status === 204) {
    return undefined as T
  }

  if (!response.ok) {
    let message = statusFallbackMessage(response.status)
    try {
      const parsed = (await parseJsonBody<{ error?: string }>(response)) ?? {}
      if (parsed.error) {
        message = parsed.error
      }
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  return parseJsonBody<T>(response)
}

const IMPACT_CACHE_PREFIX = '/public/impact'
const storageKey = (path: string) => `beacon:impact-cache:${path}`

const impactMemory = new Map<string, unknown>()
const impactInflight = new Map<string, Promise<unknown>>()

function isImpactPublicPath(path: string): boolean {
  return path === IMPACT_CACHE_PREFIX || path.startsWith(`${IMPACT_CACHE_PREFIX}/`)
}

function readImpactCache<T>(path: string): T | undefined {
  if (impactMemory.has(path)) {
    return impactMemory.get(path) as T
  }
  if (typeof sessionStorage === 'undefined') return undefined
  try {
    const raw = sessionStorage.getItem(storageKey(path))
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as T
    impactMemory.set(path, parsed)
    return parsed
  } catch {
    return undefined
  }
}

function writeImpactCache(path: string, data: unknown) {
  impactMemory.set(path, data)
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(storageKey(path), JSON.stringify(data))
  } catch {
    /* quota or private mode */
  }
}

async function fetchJsonImpactCached<T>(path: string): Promise<T> {
  const cached = readImpactCache<T>(path)
  if (cached !== undefined) return cached

  const inflight = impactInflight.get(path) as Promise<T> | undefined
  if (inflight) return inflight

  const promise = fetchJson<T>(path)
    .then((data) => {
      writeImpactCache(path, data)
      return data
    })
    .finally(() => {
      impactInflight.delete(path)
    })

  impactInflight.set(path, promise)
  return promise
}

export type UseApiResourceOptions = {
  /** Cache successful responses in memory + sessionStorage; dedupe concurrent fetches. */
  sessionCacheImpact?: boolean
}

export function useApiResource<T>(path: string, emptyValue: T, options?: UseApiResourceOptions) {
  const useImpactCache = options?.sessionCacheImpact === true && isImpactPublicPath(path)
  const [reloadNonce, setReloadNonce] = useState(0)
  const reload = useCallback(() => {
    setReloadNonce((n) => n + 1)
  }, [])

  const [state, setState] = useState<ResourceState<T>>(() => {
    if (useImpactCache) {
      const cached = readImpactCache<T>(path)
      if (cached !== undefined) {
        return { data: cached, isLoading: false, error: null, source: 'live' }
      }
    }
    return { data: emptyValue, isLoading: true, error: null, source: 'fallback' }
  })

  useEffect(() => {
    let active = true

    async function run() {
      if (useImpactCache) {
        const cached = readImpactCache<T>(path)
        if (cached !== undefined) {
          setState({ data: cached, isLoading: false, error: null, source: 'live' })
          return
        }
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const loader = useImpactCache ? fetchJsonImpactCached<T> : fetchJson<T>
        const data = await loader(path)
        if (!active) return

        setState({ data, isLoading: false, error: null, source: 'live' })
      } catch (error) {
        if (!active) return

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Could not reach the API.',
          source: 'fallback',
        }))
      }
    }

    void run()
    return () => { active = false }
  }, [path, useImpactCache, reloadNonce])

  return { ...state, reload }
}
