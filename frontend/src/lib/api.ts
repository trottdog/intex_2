import { useEffect, useRef, useState } from 'react'

const DEFAULT_API_BASE = 'http://localhost:4000'

/** In dev, when VITE_API_BASE_URL is unset, use the Vite proxy (see vite.config.ts). */
function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim()

  if (configured && configured.length > 0) {
    return configured.replace(/\/$/, '')
  }

  if (import.meta.env.DEV) {
    return '/api'
  }

  return DEFAULT_API_BASE
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

export function useApiResource<T>(path: string, fallback: T) {
  // Inline object/array fallbacks get a new reference every render; including them
  // in the effect deps caused a fetch → setState → re-render → repeat storm.
  const fallbackRef = useRef(fallback)
  fallbackRef.current = fallback

  const [state, setState] = useState<ResourceState<T>>({
    data: fallback,
    isLoading: true,
    error: null,
    source: 'fallback',
  })

  useEffect(() => {
    let active = true

    async function run() {
      const fb = fallbackRef.current
      setState({
        data: fb,
        isLoading: true,
        error: null,
        source: 'fallback',
      })

      try {
        const data = await fetchJson<T>(path)
        if (!active) {
          return
        }

        setState({
          data,
          isLoading: false,
          error: null,
          source: 'live',
        })
      } catch (error) {
        if (!active) {
          return
        }

        setState({
          data: fallbackRef.current,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : 'We could not reach the backend API. Showing the prepared frontend fallback.',
          source: 'fallback',
        })
      }
    }

    void run()

    return () => {
      active = false
    }
  }, [path])

  return state
}
