import { useEffect, useState } from 'react'

/**
 * In production, VITE_API_BASE_URL must be set at build time (see `frontend/.env.production`).
 * Browsers block HTTPS pages (e.g. beacon.trottdog.com) from calling http://localhost — not a CORS header fix.
 */
function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim()

  if (configured && configured.length > 0) {
    return configured.replace(/\/$/, '')
  }

  if (import.meta.env.DEV) {
    return '/api'
  }

  // Production without VITE_API_BASE_URL would default to localhost and break on HTTPS deploys
  // (browser blocks public sites from Private Network Access / loopback — not fixable with CORS).
  if (import.meta.env.PROD) {
    throw new Error(
      'VITE_API_BASE_URL must be set for production builds (see frontend/.env.production or CI env).',
    )
  }

  return 'http://localhost:4000'
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

export async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return (await response.json()) as T
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
  }, [path, useImpactCache])

  return state
}
