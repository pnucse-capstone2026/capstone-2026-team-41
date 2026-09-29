import { http } from './httpClient'

/**
 * 지갑 — 실 백엔드 GET /api/tokens/wallet 응답.
 * TEAM 플랜 멤버는 개인 지갑이 아니라 팀 공유 지갑 잔액이 내려온다(team: true).
 *
 * DAST(웹 점검)는 토큰이 아니라 <b>횟수</b>로 별도 관리된다 — subscriptionBalance 등
 * 토큰 필드와는 완전히 다른 통이다. websiteScansLeft는 dastAvailable과 같은 값이다
 * (구 필드명 유지, 화면 쪽 변경 없이 그대로 쓸 수 있다).
 */
export interface TokenWallet {
  plan: 'FREE' | 'PRO' | 'MAX' | 'TEAM'
  team: boolean
  // 토큰(SAST·GitHub App 액션 전용)
  subscriptionBalance: number
  purchasedBalance: number
  heldBalance: number
  available: number
  monthlyGrant: number
  sourceLinesLeft: number
  sourceLinesMonthlyLimit: number
  // DAST(웹 점검) — 횟수 단위, 토큰과 무관
  dastSubscriptionRemaining: number
  dastPurchasedRemaining: number
  dastHeld: number
  dastAvailable: number
  dastMonthlyLimit: number
  /** @deprecated dastAvailable과 동일한 값. 기존 화면 호환용. */
  websiteScansLeft: number
  periodEnd: string | null
  maxConcurrentDastScans: number
  maxConcurrentSastScans: number
  topUpPriceKrw: number
  topUpTokens: number
  dastTopUpPriceKrw: number
  dastTopUpCount: number
}

export const fetchWallet = () => http<TokenWallet>('/api/tokens/wallet')

export interface PurchaseResult {
  priceKrw: number
}

/**
 * 토큰 충전(SAST·액션 전용). 5,000원 = 3,000토큰(1구좌).
 * ⚠️ PG 미연동 — 결제 검증 없이 즉시 확정된다(백엔드와 동일한 한계, 데모/개발 전용).
 */
export const purchaseTokens = (units: number) =>
  http<{ purchasedTokens: number; priceKrw: number; available: number }>('/api/tokens/purchase', {
    method: 'POST',
    body: JSON.stringify({ units }),
  })

/**
 * DAST(웹 점검) 횟수 충전. 5,000원 = 3회(1구좌).
 * ⚠️ PG 미연동 — 결제 검증 없이 즉시 확정된다.
 */
export const purchaseDast = (units: number) =>
  http<{ purchasedCount: number; priceKrw: number; dastAvailable: number }>('/api/tokens/purchase-dast', {
    method: 'POST',
    body: JSON.stringify({ units }),
  })

export interface TokenLedgerEntry {
  entryId: string
  entryType: 'GRANT' | 'SIGNUP_BONUS' | 'TRIAL_GRANT' | 'PURCHASE' | 'HOLD' | 'COMMIT' | 'RELEASE' | 'EXPIRE' | 'ADJUST'
  amount: number
  memo: string | null
  createdAt: string
}

interface SpringPage<T> {
  content: T[]
  number: number
  totalPages: number
  totalElements: number
}

export const fetchLedger = async (page = 0, size = 20) =>
  http<SpringPage<TokenLedgerEntry>>(`/api/tokens/ledger?page=${page}&size=${size}`)
