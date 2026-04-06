import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

export type UserRole = 'public' | 'donor' | 'admin' | 'super-admin'

export type SessionUser = {
  email: string
  fullName: string
  role: UserRole
  facilityName?: string
}

type SessionContextValue = {
  user: SessionUser | null
  signIn: (nextUser: SessionUser) => void
  signOut: () => void
}

const STORAGE_KEY = 'intex.session'

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return
    }

    try {
      setUser(JSON.parse(raw) as SessionUser)
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      signIn(nextUser) {
        setUser(nextUser)
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
      },
      signOut() {
        setUser(null)
        window.localStorage.removeItem(STORAGE_KEY)
      },
    }),
    [user],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const value = useContext(SessionContext)

  if (!value) {
    throw new Error('useSession must be used inside SessionProvider')
  }

  return value
}
