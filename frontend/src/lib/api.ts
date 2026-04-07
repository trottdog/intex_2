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

export function useApiResource<T>(path: string, emptyValue: T) {
  const [state, setState] = useState<ResourceState<T>>({
    data: emptyValue,
    isLoading: true,
    error: null,
    source: 'fallback',
  })

  useEffect(() => {
    let active = true

    async function run() {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const data = await fetchJson<T>(path)
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
  }, [path])

  return state
}
