import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { AuthMeResponse } from '../lib/authApi'
import { fetchMe, logoutRequest } from '../lib/authApi'

export type UserRole = 'public' | 'donor' | 'admin' | 'super-admin'

export type SessionUser = {
  email: string
  fullName: string
  role: UserRole
  facilityName?: string
  supporterId?: number
  safehouseIds?: number[]
}

export type SessionStatus = 'loading' | 'anonymous' | 'authenticated'

type SessionContextValue = {
  user: SessionUser | null
  sessionStatus: SessionStatus
  signIn: (nextUser: SessionUser) => void
  refreshSession: () => Promise<void>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

/** Maps ASP.NET Identity role names to UI role (first match by precedence). */
export function mapApiRolesToUserRole(roles: string[] | undefined | null): UserRole {
  const list = roles ?? []
  const norm = new Set(list.map((r) => (typeof r === 'string' ? r.trim().toLowerCase() : '')))
  if (norm.has('superadmin')) {
    return 'super-admin'
  }
  if (norm.has('admin')) {
    return 'admin'
  }
  if (norm.has('donor')) {
    return 'donor'
  }
  return 'public'
}

export function mapMeToSessionUser(me: AuthMeResponse): SessionUser {
  const role = mapApiRolesToUserRole(me.roles)
  let facilityName: string | undefined
  if (role === 'super-admin') {
    facilityName = 'All facilities'
  } else if (role === 'admin' && me.safehouseIds.length > 0) {
    facilityName = `Safehouse scope: ${me.safehouseIds.join(', ')}`
  }

  return {
    email: me.email ?? '',
    fullName: me.fullName?.trim() || me.email || 'Signed-in user',
    role,
    facilityName,
    supporterId: me.supporterId ?? undefined,
    safehouseIds: me.safehouseIds.length ? me.safehouseIds : undefined,
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('loading')
  /** Bumps when user signs in/out so in-flight GET /auth/me from an older refresh cannot overwrite the client session. */
  const sessionEpoch = useRef(0)

  const refreshSession = useCallback(async () => {
    const epoch = sessionEpoch.current
    try {
      const me = await fetchMe()
      if (epoch !== sessionEpoch.current) {
        return
      }
      if (me === null) {
        setUser(null)
        setSessionStatus('anonymous')
        return
      }
      setUser(mapMeToSessionUser(me))
      setSessionStatus('authenticated')
    } catch {
      if (epoch !== sessionEpoch.current) {
        return
      }
      setUser(null)
      setSessionStatus('anonymous')
    }
  }, [])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  const signIn = useCallback((nextUser: SessionUser) => {
    sessionEpoch.current += 1
    setUser(nextUser)
    setSessionStatus('authenticated')
  }, [])

  const signOut = useCallback(async () => {
    sessionEpoch.current += 1
    try {
      await logoutRequest()
    } catch {
      /* still clear local session */
    } finally {
      setUser(null)
      setSessionStatus('anonymous')
    }
  }, [])

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      sessionStatus,
      signIn,
      refreshSession,
      signOut,
    }),
    [user, sessionStatus, signIn, refreshSession, signOut],
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
