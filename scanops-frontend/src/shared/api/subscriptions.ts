import { http } from './httpClient'
import type { PlanId } from '../lib/mock'

/**
 * 구독 API. ⚠️ PG 미연동 — activate는 실제 결제 검증 없이 즉시 확정된다(백엔드와 동일한 한계).
 */

export interface TrialResult {
  plan: PlanId
  status: string
  trialEnd: string | null
}

export interface ActivateResult {
  plan: PlanId
  status: string
  currentPeriodEnd: string | null
  seats: number
  priceKrw: number
}

/** 7일 무료체험 시작. PRO 전용, 계정당 1회 — 이미 썼으면 409. */
export const startTrial = () =>
  http<TrialResult>('/api/subscriptions/trial', { method: 'POST' })

/** 결제 확정 → 플랜 활성화 + 토큰 지급. TEAM은 먼저 팀이 있어야 한다(없으면 409). */
export const activateSubscription = (plan: PlanId, seats?: number, paymentId?: string) =>
  http<ActivateResult>('/api/subscriptions/activate', {
    method: 'POST',
    body: JSON.stringify({ plan, seats, paymentId }),
  })

export const cancelSubscription = () =>
  http<{ cancelAtPeriodEnd: boolean; currentPeriodEnd: string | null }>('/api/subscriptions/cancel', { method: 'POST' })

export const resumeSubscription = () =>
  http<{ cancelAtPeriodEnd: boolean }>('/api/subscriptions/resume', { method: 'POST' })
