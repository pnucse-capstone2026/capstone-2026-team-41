import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { PlanId, User } from './mock'
import i18n from './i18n'

/**
 * Authentication/session.
 * - GitHub OAuth is REAL: the button redirects to the backend, which exchanges
 *   the code and redirects back with a JWT; `loginWithToken` calls /api/auth/me.
 * - Email/password is REAL too: signup/login POST to the backend, which issues
 *   the same JWT format, so DAST/scan APIs authorize identically to GitHub.
 * Token is stored in localStorage and attached as Bearer by the http client.
 */

const STORAGE_KEY = 'scanops.session'
const TOKEN_KEY = 'scanops.token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

/** POST email credentials, return the issued JWT (or throw the backend's message). */
async function emailAuth(path: string, body: { email: string; password: string }): Promise<string> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error ?? i18n.t('auth.genericError', { ns: 'common' }))
  return data.token as string
}

interface AuthState {
  user: User | null
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  /** Completes a REAL GitHub login from the OAuth callback (?token=…). */
  loginWithToken: (token: string) => Promise<void>
  /** Mock GitHub completion — local-dev fallback when no token is present. */
  completeGitHub: (login: string) => Promise<User>
  logout: () => void
  update: (patch: Partial<User>) => void
  /** Re-fetches /api/auth/me with the current session token — call after any
   *  backend change that can affect the profile (e.g. plan/subscription updates)
   *  so `user.plan` doesn't go stale until next login. */
  refreshUser: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth must be used within AuthProvider')
  return c
}

function persist(u: User | null) {
  if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
  else localStorage.removeItem(STORAGE_KEY)
}

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms))

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setUser(JSON.parse(raw))
    } catch { /* ignore */ }
    setReady(true)
  }, [])

  const set = (u: User | null) => {
    setUser(u)
    persist(u)
  }

  const makeUser = (email: string, plan: PlanId = 'PRO', githubLogin?: string): User => ({
    id: 'u-' + email.length,
    name: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    email,
    plan,
    githubLogin: githubLogin ?? null,
  })

  // REAL: email login/signup issue the same JWT as GitHub, so DAST/scan APIs
  // authorize the session. On failure we surface the backend's error message.
  const login = async (email: string, password: string) => {
    const token = await emailAuth('/api/auth/login', { email, password })
    await loginWithToken(token)
  }
  const signup = async (email: string, password: string) => {
    const token = await emailAuth('/api/auth/signup', { email, password })
    await loginWithToken(token)
  }
  const completeGitHub = async (login: string) => {
    await delay(900)
    const u = makeUser(`${login}@users.noreply.github.com`, 'PRO', login)
    u.name = login
    set(u)
    return u
  }
  // REAL: store JWT from OAuth callback, then fetch the profile from the backend.
  const loginWithToken = async (token: string) => {
    localStorage.setItem(TOKEN_KEY, token)
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('me failed')
    const me = await res.json()
    set({
      id: String(me.id),
      name: me.name || me.githubLogin || me.email?.split('@')[0],
      email: me.email || `${me.githubLogin}@users.noreply.github.com`,
      plan: (me.plan as PlanId) ?? 'FREE',
      avatarUrl: me.avatarUrl || null,
      githubLogin: me.githubLogin || null,
    })
  }
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    set(null)
  }
  const refreshUser = async () => {
    const token = getToken()
    if (token) await loginWithToken(token)
  }
  const update = (patch: Partial<User>) => setUser((u) => {
    if (!u) return u
    const next = { ...u, ...patch }
    persist(next)
    return next
  })

  return (
    <Ctx.Provider value={{ user, ready, login, signup, loginWithToken, completeGitHub, logout, update, refreshUser }}>
      {children}
    </Ctx.Provider>
  )
}
