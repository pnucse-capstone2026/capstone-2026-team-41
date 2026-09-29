import { http } from './httpClient'
import { enrichZap } from '../lib/zapMeta'
import type { Report, ScanMode, ScanSummary, Severity, SeverityCounts, Vulnerability } from '../lib/mock'

/**
 * 실 백엔드 스캔 API.
 * - DAST(웹) / SAST(레포)는 실제 백엔드 스캔.
 * - PR 분석은 프론트가 호출하지 않는다 — GitHub App 웹훅이 서버에서 자동 처리.
 */

interface BeScanJob {
  scanId: string
  target: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  scanCategory?: 'DAST' | 'SAST'
  verified?: boolean
  scanMode: 'WEBSITE' | 'GITHUB_REPO'
  vulnHigh?: number
  vulnMedium?: number
  vulnLow?: number
  maxCvssScore?: number | null
  createdAt: string
  completedAt?: string | null
  failureReason?: string | null
}

interface BeVuln {
  vulnId: string
  vulnType: string
  url?: string
  parameter?: string
  severity?: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL'
  cvssScore?: number | null
  cvssVector?: string | null
  cause?: string        // 기존 aiAnalysis/description 통합
  solution?: string
}

/** 백엔드가 만든 UUID인지(실 스캔) vs 목 id("s-1041")인지. */
export const isRealId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i.test(id)

export const createWebsiteScan = (targetUrl: string, ownerEmail: string) =>
  http<BeScanJob>('/api/scans', {
    method: 'POST',
    body: JSON.stringify({ targetUrl, ownerEmail, scanMode: 'WEBSITE' }),
  })

/**
 * GitHub 레포 입력을 백엔드가 요구하는 https://github.com/owner/repo 형태로 정규화.
 * 폼은 짧은 형식(acme/payments-api) 또는 github.com URL 둘 다 허용한다.
 */
const toGithubUrl = (repo: string) => {
  const t = repo.trim().replace(/^\/+/, '')
  if (/github\.com/i.test(t)) return t.startsWith('http') ? t : `https://${t}`
  return `https://github.com/${t}`
}

/** SAST — 실제 백엔드 레포 코드 분석(QLoRA 모델 파이프라인). */
export const createRepoScan = (repo: string, ownerEmail: string) =>
  http<BeScanJob>('/api/scans', {
    method: 'POST',
    body: JSON.stringify({ targetUrl: toGithubUrl(repo), ownerEmail, scanMode: 'GITHUB_REPO' }),
  })

export const getScanJob = (id: string) => http<BeScanJob>(`/api/scans/${id}`)
export const getScanVulns = (id: string) => http<BeVuln[]>(`/api/scans/${id}/vulnerabilities`)

/** Spring Data Page 응답(필요한 필드만). */
interface SpringPage<T> {
  content: T[]
  number: number        // 0-based 현재 페이지
  totalPages: number
  totalElements: number
  first: boolean
  last: boolean
}

/** 대시보드 등 "최근 스캔" 요약용 — 첫 페이지(최신 50건). 기록 페이지는 fetchScansPage 사용. */
export const listScanJobs = async () =>
  (await http<SpringPage<BeScanJob>>('/api/scans?page=0&size=50')).content

/** 스캔 기록 한 페이지(최신순). 백엔드가 page/size/mode/q로 페이지네이션. */
export interface ScanPage {
  items: ScanSummary[]
  page: number
  totalPages: number
  totalElements: number
  first: boolean
  last: boolean
}

export async function fetchScansPage(opts: {
  page: number
  size?: number
  mode?: ScanMode | 'ALL'
  q?: string
}): Promise<ScanPage> {
  const { page, size = 10, mode = 'ALL', q = '' } = opts
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (mode && mode !== 'ALL') params.set('mode', mode)
  if (q.trim()) params.set('q', q.trim())
  const res = await http<SpringPage<BeScanJob>>(`/api/scans?${params.toString()}`)
  return {
    items: res.content.map((j) => mapJobToSummary(j)),
    page: res.number,
    totalPages: res.totalPages,
    totalElements: res.totalElements,
    first: res.first,
    last: res.last,
  }
}

/** 스캔 기록 삭제(연결된 취약점도 백엔드에서 함께 제거). */
export const deleteScan = (id: string) =>
  http<void>(`/api/scans/${id}`, { method: 'DELETE' })

// ── GitHub 레포(실데이터) ────────────────────────────────────────────────
export interface MyGithubRepo {
  id: number
  fullName: string
  private: boolean
  defaultBranch: string
  htmlUrl?: string
  language?: string | null
  pushedAt?: string | null
}

/** 로그인 사용자가 소유한 GitHub 공개 레포 목록. */
export const fetchMyGithubRepos = () => http<MyGithubRepo[]>('/api/github/repos')

// ── mappers ───────────────────────────────────────────────────────────────
function mapSeverity(risk?: string, cvss?: number | null): Severity {
  if ((cvss ?? 0) >= 9) return 'CRITICAL'
  switch (risk) {
    case 'HIGH': return 'HIGH'
    case 'MEDIUM': return 'MEDIUM'
    case 'LOW': return 'LOW'
    default: return 'INFO'
  }
}

function mapVuln(v: BeVuln): Vulnerability {
  const cvss = v.cvssScore ?? 0
  const meta = enrichZap(v.vulnType || '') // 흔한 ZAP 경보 → 한국어 메타
  return {
    id: v.vulnId,
    name: meta?.name ?? v.vulnType ?? '취약점',
    cwe: meta?.cwe ?? '',
    severity: mapSeverity(v.severity, cvss),
    cvss,
    cvssVector: v.cvssVector ?? '',
    location: [v.url, v.parameter].filter(Boolean).join(' → '),
    evidence: '',
    // "쉽게 말하면": 사전 한 줄 → 백엔드 분석(cause) 순
    plain: meta?.plain ?? '',
    summary: meta?.summary ?? '',
    attack: meta?.attack ?? v.cause ?? '',
    fix: meta?.fix ?? v.solution ?? '',
    aiModel: meta ? 'ZAP + AI' : 'ScanOps AI',
    confidence: 1,
    graphVerdict: 'LLM_ONLY',
  }
}

/** Scan 요약의 심각도별 카운트(목록 뷰용 — 취약점 미조회 시 백엔드 집계 사용). */
function countsFromJob(j: BeScanJob): SeverityCounts {
  return { CRITICAL: 0, HIGH: j.vulnHigh ?? 0, MEDIUM: j.vulnMedium ?? 0, LOW: j.vulnLow ?? 0, INFO: 0 }
}

function countsOf(vs: Vulnerability[]): SeverityCounts {
  const c: SeverityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 }
  vs.forEach((v) => (c[v.severity] += 1))
  return c
}

export function mapJobToSummary(j: BeScanJob, vulns?: Vulnerability[]): ScanSummary {
  const counts = vulns ? countsOf(vulns) : countsFromJob(j)
  const maxCvss = vulns ? vulns.reduce((m, v) => Math.max(m, v.cvss), 0) : (j.maxCvssScore ?? 0)
  const dur = j.completedAt ? Math.max(1, Math.round((+new Date(j.completedAt) - +new Date(j.createdAt)) / 1000)) : undefined
  return {
    id: j.scanId,
    target: j.target,
    mode: j.scanMode,
    // UI 모델은 'DONE'을 사용 → 백엔드 'COMPLETED' 매핑
    status: j.status === 'COMPLETED' ? 'DONE' : j.status,
    maxCvss,
    counts,
    total: vulns ? vulns.length : ((j.vulnHigh ?? 0) + (j.vulnMedium ?? 0) + (j.vulnLow ?? 0)),
    createdAt: j.createdAt,
    finishedAt: j.completedAt ?? undefined,
    durationSec: dur,
  }
}

export async function fetchRealReport(id: string): Promise<Report> {
  const [job, beVulns] = await Promise.all([getScanJob(id), getScanVulns(id)])
  const vulns = beVulns.map(mapVuln)
  return { ...mapJobToSummary(job, vulns), vulnerabilities: vulns }
}

/** 대시보드 "최근 스캔" 등에서 쓰는 실제 스캔 기록(최신순, 최대 50건). */
export async function fetchRecentScans(): Promise<ScanSummary[]> {
  return (await listScanJobs()).map((j) => mapJobToSummary(j))
}
