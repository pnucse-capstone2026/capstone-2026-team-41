import { http } from './httpClient'

const WEBAPP_URL = import.meta.env.VITE_SURVEY_WEBAPP_URL as string | undefined

/**
 * 베타테스터 사용경험 설문 → Google Sheets 저장용 Apps Script 웹 앱으로 전송.
 * CORS preflight를 피하려고 Content-Type을 text/plain으로 보낸다(Apps Script 쪽에서 JSON.parse).
 */
export async function submitSurvey(payload: Record<string, unknown>): Promise<boolean> {
  if (!WEBAPP_URL) return false
  try {
    await fetch(WEBAPP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    })
    return true
  } catch {
    return false
  }
}

/**
 * 설문 참여 여부(계정당 1회 제한용) — 실제 응답 내용이 아니라 참여 시각만 백엔드가 추적한다.
 */
export interface SurveyStatus {
  completed: boolean
  completedAt: string
}

export const fetchSurveyStatus = () => http<SurveyStatus>('/api/survey/status')

/** Apps Script 전송이 끝난 뒤 호출해 "참여 완료"로 표시한다(멱등). */
export const completeSurvey = () => http<SurveyStatus>('/api/survey/complete', { method: 'POST' })
