import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './auth'

export interface TourStep {
  id: string
  /** CSS selector for the element to spotlight (matched via data-tour attributes). */
  selector: string
  /** i18n key (common namespace) for the step title — resolved at render time so it tracks the active language. */
  titleKey: string
  /** i18n key (common namespace) for the step description — resolved at render time so it tracks the active language. */
  descKey: string
  placement: 'bottom' | 'top'
}

/** Beta onboarding tour. Every target lives on /dashboard, so no cross-page nav is needed. */
export const TOUR_STEPS: TourStep[] = [
  {
    id: 'new-scan',
    selector: '[data-tour="dashboard-new-scan"]',
    titleKey: 'tour.newScan.title',
    descKey: 'tour.newScan.desc',
    placement: 'bottom',
  },
  {
    id: 'usage',
    selector: '[data-tour="usage-cards"]',
    titleKey: 'tour.usage.title',
    descKey: 'tour.usage.desc',
    placement: 'bottom',
  },
  {
    id: 'token-balance',
    selector: '[data-tour="posture-card"]',
    titleKey: 'tour.tokenBalance.title',
    descKey: 'tour.tokenBalance.desc',
    placement: 'bottom',
  },
  {
    id: 'recent-scans',
    selector: '[data-tour="recent-scans-card"]',
    titleKey: 'tour.recentScans.title',
    descKey: 'tour.recentScans.desc',
    placement: 'top',
  },
  {
    id: 'integrations',
    selector: '[data-tour="nav-integrations"]',
    titleKey: 'tour.integrations.title',
    descKey: 'tour.integrations.desc',
    placement: 'bottom',
  },
  {
    id: 'pricing',
    selector: '[data-tour="nav-pricing"]',
    titleKey: 'tour.pricing.title',
    descKey: 'tour.pricing.desc',
    placement: 'bottom',
  },
  {
    id: 'account',
    selector: '[data-tour="nav-avatar"]',
    titleKey: 'tour.account.title',
    descKey: 'tour.account.desc',
    placement: 'bottom',
  },
]

interface TourCtx {
  active: boolean
  stepIndex: number
  steps: TourStep[]
  next: () => void
  prev: () => void
  skip: () => void
  /** Manually replay the tour (e.g. from a "가이드 다시보기" menu item). */
  restart: () => void
}

const Ctx = createContext<TourCtx | null>(null)

export function useTour() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useTour must be used within TourProvider')
  return c
}

const seenKey = (email: string) => `scanops.tour.seen.${email}`
/** Poll for the first step's target to mount (skeletons resolve async) before revealing it. */
const POLL_MS = 80
const POLL_TRIES = 40

export function TourProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const autoTriedRef = useRef(false)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const beginWhenReady = useCallback(() => {
    if (pollRef.current) clearTimeout(pollRef.current)
    let tries = 0
    const tick = () => {
      if (document.querySelector(TOUR_STEPS[0].selector)) {
        setStepIndex(0)
        setActive(true)
        return
      }
      if (tries++ < POLL_TRIES) pollRef.current = setTimeout(tick, POLL_MS)
    }
    tick()
  }, [])

  useEffect(() => () => { if (pollRef.current) clearTimeout(pollRef.current) }, [])

  // Auto-start once per beta tester, the first time they land on the dashboard.
  useEffect(() => {
    if (!user || location.pathname !== '/dashboard') return
    if (autoTriedRef.current || localStorage.getItem(seenKey(user.email))) return
    autoTriedRef.current = true
    const t = setTimeout(beginWhenReady, 350)
    return () => clearTimeout(t)
  }, [user, location.pathname, beginWhenReady])

  const finish = useCallback(() => {
    setActive(false)
    if (user) localStorage.setItem(seenKey(user.email), '1')
  }, [user])

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i + 1 >= TOUR_STEPS.length) { finish(); return i }
      return i + 1
    })
  }, [finish])

  const prev = useCallback(() => setStepIndex((i) => Math.max(0, i - 1)), [])
  const skip = useCallback(() => finish(), [finish])

  const restart = useCallback(() => {
    if (location.pathname !== '/dashboard') navigate('/dashboard')
    beginWhenReady()
  }, [location.pathname, navigate, beginWhenReady])

  return (
    <Ctx.Provider value={{ active, stepIndex, steps: TOUR_STEPS, next, prev, skip, restart }}>
      {children}
    </Ctx.Provider>
  )
}
