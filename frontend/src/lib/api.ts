import { useEffect, useState } from 'react'

const DEFAULT_API_BASE = 'http://localhost:4000'

type ResourceState<T> = {
  data: T
  isLoading: boolean
  error: string | null
  source: 'live' | 'fallback'
}

export function getApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL

  if (configured && configured.trim().length > 0) {
    return configured.replace(/\/$/, '')
  }

  return DEFAULT_API_BASE
}

export async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
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
  const [state, setState] = useState<ResourceState<T>>({
    data: fallback,
    isLoading: true,
    error: null,
    source: 'fallback',
  })

  useEffect(() => {
    let active = true

    async function run() {
      setState({
        data: fallback,
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
          data: fallback,
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
  }, [fallback, path])

  return state
}
