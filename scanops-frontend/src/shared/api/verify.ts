import { http } from './httpClient'

export interface DomainVerifyInit {
  domain: string
  token: string
  path: string // "/.well-known/scanops-verify.txt"
  verified: boolean
}

/** 인증 시작 — 토큰·업로드 경로 발급. */
export const initDomainVerify = (url: string) =>
  http<DomainVerifyInit>('/api/verify/domain', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })

/** 실제 확인 — 백엔드가 .well-known 파일을 fetch해 토큰 대조. */
export const confirmDomainVerify = (url: string) =>
  http<{ verified: boolean }>('/api/verify/domain/confirm', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
