/**
 * Mock data layer (frontend-only). Simulates the ScanOps backend so every
 * screen works without a live API. Swap these accessors for real HTTP calls
 * in `shared/api` once endpoints exist — the return shapes are the contract.
 */

export type ScanMode = 'WEBSITE' | 'GITHUB_REPO' | 'GITHUB_ACTIONS'
export type ScanStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED'
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
export type PlanId = 'FREE' | 'PRO' | 'MAX' | 'TEAM'

export interface SeverityCounts {
  CRITICAL: number; HIGH: number; MEDIUM: number; LOW: number; INFO: number
}

export interface ScanSummary {
  id: string
  target: string
  mode: ScanMode
  status: ScanStatus
  maxCvss: number
  counts: SeverityCounts
  total: number
  createdAt: string
  finishedAt?: string
  durationSec?: number
  loc?: number
}

export interface Vulnerability {
  id: string
  name: string
  cwe: string
  severity: Severity
  cvss: number
  cvssVector: string
  location: string
  evidence: string
  /** 비전문가도 이해하는 한 줄 설명 ("쉽게 말하면"). */
  plain: string
  summary: string
  attack: string
  fix: string
  fixCode?: string
  aiModel: string
  confidence: number
  graphVerdict: 'CONFIRMED' | 'SUPPRESSED' | 'LLM_ONLY'
}

export interface Report extends ScanSummary {
  vulnerabilities: Vulnerability[]
}

export interface User {
  id: string
  name: string
  email: string
  plan: PlanId
  avatarUrl?: string | null
  githubLogin?: string | null
}

export interface GitHubRepo {
  id: number
  fullName: string
  private: boolean
  defaultBranch: string
  lastScan?: string
  connected: boolean
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  avatarUrl?: string | null
  status: 'ACTIVE' | 'INVITED'
}

// ── plan catalog ─────────────────────────────────────────────────────────
/**
 * SAST(레포 분석)와 GitHub App(액션)은 별도 한도가 아니라 토큰 하나를 공유해서 쓴다
 * (0.3 토큰/줄로 단가가 같다) — 그래서 `sastActions` 한 필드로 합쳐서 표시한다.
 * DAST(웹 점검)만 별도 통(횟수)이다.
 */
export interface PlanInfo {
  id: PlanId
  name: string
  price: number
  per: string
  desc: string
  popular?: boolean
  trial?: string
  dast: string
  /** SAST + GitHub App 액션 공용 토큰 한도. */
  sastActions: string
  highlight: string
}

export const PLANS: PlanInfo[] = [
  { id: 'FREE', name: 'Free', price: 0, per: '', desc: '회원가입만 하면 바로 체험', dast: '1회 무료', sastActions: '미지원', highlight: '스캔 결과 1개월 보관' },
  { id: 'PRO', name: 'Pro', price: 19900, per: '/월', desc: '1인 개발자·바이브코더에게 추천', popular: true, trial: '7일 무료체험', dast: '월 5회', sastActions: '월 10만 줄', highlight: 'AI 브리핑·PDF 리포트' },
  { id: 'MAX', name: 'Max', price: 69000, per: '/월', desc: '코드량이 많은 개인에게 추천', dast: '월 30회', sastActions: '월 40만 줄', highlight: '우선 분석 큐' },
  { id: 'TEAM', name: 'Team', price: 59000, per: '/월', desc: '3~5인 스타트업 팀 · 기본 3명 포함', dast: '월 20회', sastActions: '월 33만 줄', highlight: '멤버·권한 관리' },
]

export const planById = (id: PlanId) => PLANS.find((p) => p.id === id)!

// ── seed: vulnerabilities ──────────────────────────────────────────────────
const VULNS: Vulnerability[] = [
  {
    id: 'v1', name: 'SQL Injection', cwe: 'CWE-89', severity: 'CRITICAL', cvss: 9.8,
    cvssVector: 'AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    location: 'POST /api/login → username',
    evidence: `String sql = "SELECT * FROM users WHERE name='" + username + "'";`,
    plain: '로그인 창에 특수문자를 넣는 것만으로 비밀번호 없이 남의 계정에 들어갈 수 있어요.',
    summary: '로그인 쿼리가 사용자 입력을 문자열로 직접 연결해, 인증 우회·데이터 유출이 가능합니다.',
    attack: "username에 ' OR '1'='1' -- 를 넣으면 비밀번호 검증 없이 첫 사용자로 로그인됩니다.",
    fix: 'PreparedStatement로 파라미터를 바인딩하세요. 입력값을 쿼리 문자열에 직접 연결하지 마세요.',
    fixCode: `String sql = "SELECT * FROM users WHERE name = ?";\nps.setString(1, username);`,
    aiModel: 'ScanOps 보안 AI', confidence: 0.98, graphVerdict: 'CONFIRMED',
  },
  {
    id: 'v2', name: 'Reflected XSS', cwe: 'CWE-79', severity: 'HIGH', cvss: 7.4,
    cvssVector: 'AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N',
    location: 'GET /search → q',
    evidence: `response.getWriter().write("결과: " + request.getParameter("q"));`,
    plain: '검색창에 심은 악성 스크립트가, 그 링크를 클릭한 사람의 브라우저에서 몰래 실행돼요.',
    summary: '검색어가 이스케이프 없이 응답에 출력돼, 스크립트가 피해자 브라우저에서 실행됩니다.',
    attack: 'q=<script>fetch(`/steal?c=${document.cookie}`)</script> 링크로 세션 탈취가 가능합니다.',
    fix: '출력 시 HTML 인코딩(ESAPI.encodeForHTML 등)을 적용하세요.',
    fixCode: `out.write("결과: " + ESAPI.encoder().encodeForHTML(q));`,
    aiModel: 'ScanOps 보안 AI', confidence: 0.91, graphVerdict: 'CONFIRMED',
  },
  {
    id: 'v3', name: 'Weak Cryptographic Algorithm', cwe: 'CWE-327', severity: 'MEDIUM', cvss: 5.9,
    cvssVector: 'AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:N/A:N',
    location: 'CryptoUtil.encrypt()',
    evidence: `Cipher c = Cipher.getInstance("DES/ECB/PKCS5Padding");`,
    plain: '오래되고 약한 암호 방식이라, 암호화를 해도 내용이 쉽게 풀릴 수 있어요.',
    summary: 'DES/ECB는 더 이상 안전하지 않은 약한 암호로, 평문 패턴이 노출됩니다.',
    attack: '짧은 키 공간과 ECB 모드의 블록 반복으로 오프라인 복호화가 현실적입니다.',
    fix: 'AES-256-GCM 같은 인증 암호화 모드를 사용하세요.',
    fixCode: `Cipher c = Cipher.getInstance("AES/GCM/NoPadding");`,
    aiModel: 'graph(java_taint)', confidence: 1.0, graphVerdict: 'CONFIRMED',
  },
  {
    id: 'v4', name: 'Insecure Cookie (Missing Secure Flag)', cwe: 'CWE-614', severity: 'LOW', cvss: 3.7,
    cvssVector: 'AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N',
    location: 'AuthController.setSession()',
    evidence: `Cookie c = new Cookie("SID", id); response.addCookie(c);`,
    plain: '로그인 상태를 담은 쿠키에 보호 설정이 없어서, 중간에서 가로채여 계정을 도용당할 수 있어요.',
    summary: '세션 쿠키에 Secure/HttpOnly 플래그가 없어 평문 전송·스크립트 접근 위험이 있습니다.',
    attack: 'HTTP 다운그레이드나 XSS로 세션 쿠키를 탈취할 수 있습니다.',
    fix: 'setSecure(true), setHttpOnly(true)를 설정하고 SameSite=Lax 이상을 적용하세요.',
    fixCode: `c.setSecure(true); c.setHttpOnly(true);`,
    aiModel: 'graph(java_taint)', confidence: 1.0, graphVerdict: 'CONFIRMED',
  },
  {
    id: 'v5', name: 'Path Traversal', cwe: 'CWE-22', severity: 'HIGH', cvss: 8.1,
    cvssVector: 'AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N',
    location: 'GET /download → file',
    evidence: `new File("/var/data/" + request.getParameter("file"));`,
    plain: "파일 이름에 '../'를 넣으면, 서버 안의 비밀번호 파일 같은 내부 파일까지 내려받을 수 있어요.",
    summary: '파일 경로에 사용자 입력이 검증 없이 들어가, 임의 파일 읽기가 가능합니다.',
    attack: 'file=../../../../etc/passwd 로 서버 내부 파일을 내려받을 수 있습니다.',
    fix: 'getCanonicalPath()로 정규화 후 허용 디렉터리 내부인지 검사하세요.',
    aiModel: 'ScanOps 보안 AI', confidence: 0.88, graphVerdict: 'LLM_ONLY',
  },
  {
    id: 'v6', name: 'Hardcoded Credentials', cwe: 'CWE-798', severity: 'MEDIUM', cvss: 6.5,
    cvssVector: 'AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N',
    location: 'config/Soap.java:14',
    evidence: `String PW = "P@ssw0rd!"; auth("svc", PW);`,
    plain: '비밀번호가 소스코드에 그대로 적혀 있어서, 코드를 본 사람이라면 누구나 바로 알 수 있어요.',
    summary: '소스코드에 자격증명이 하드코딩되어, 저장소 접근자가 그대로 탈취할 수 있습니다.',
    attack: '레포 유출 시 운영 계정이 즉시 노출됩니다.',
    fix: '비밀값을 환경변수·시크릿 매니저로 분리하세요.',
    aiModel: 'ScanOps 보안 AI + NVD RAG', confidence: 0.95, graphVerdict: 'LLM_ONLY',
  },
]

const counts = (vs: Vulnerability[]): SeverityCounts => {
  const c: SeverityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 }
  vs.forEach((v) => (c[v.severity] += 1))
  return c
}

// ── seed: scans / reports ──────────────────────────────────────────────────
function daysAgo(d: number, h = 0) {
  return new Date(Date.now() - d * 86400000 - h * 3600000).toISOString()
}

const REPORTS: Report[] = [
  {
    id: 's-1041', target: 'https://shop.example.com', mode: 'WEBSITE', status: 'DONE',
    vulnerabilities: VULNS.slice(0, 4), maxCvss: 9.8, counts: counts(VULNS.slice(0, 4)),
    total: 4, createdAt: daysAgo(0, 2), finishedAt: daysAgo(0, 1), durationSec: 214,
  },
  {
    id: 's-1039', target: 'github.com/acme/payments-api', mode: 'GITHUB_REPO', status: 'DONE',
    vulnerabilities: VULNS, maxCvss: 9.8, counts: counts(VULNS), total: VULNS.length,
    createdAt: daysAgo(1, 3), finishedAt: daysAgo(1, 2), durationSec: 642, loc: 48210,
  },
  {
    id: 's-1036', target: 'github.com/acme/web-frontend#PR-204', mode: 'GITHUB_ACTIONS', status: 'DONE',
    vulnerabilities: [VULNS[1]], maxCvss: 7.4, counts: counts([VULNS[1]]), total: 1,
    createdAt: daysAgo(2, 5), finishedAt: daysAgo(2, 5), durationSec: 38, loc: 1240,
  },
  {
    id: 's-1031', target: 'https://staging.example.com', mode: 'WEBSITE', status: 'DONE',
    vulnerabilities: [VULNS[3]], maxCvss: 3.7, counts: counts([VULNS[3]]), total: 1,
    createdAt: daysAgo(4), finishedAt: daysAgo(4), durationSec: 188,
  },
  {
    id: 's-1028', target: 'github.com/acme/legacy-billing', mode: 'GITHUB_REPO', status: 'FAILED',
    vulnerabilities: [], maxCvss: 0, counts: counts([]), total: 0, createdAt: daysAgo(6),
  },
]

// ── simulated latency ──────────────────────────────────────────────────────
const wait = <T>(v: T, ms = 320): Promise<T> => new Promise((r) => setTimeout(() => r(v), ms))

// ── accessors ──────────────────────────────────────────────────────────────
export const fetchReport = (id: string) => wait(REPORTS.find((r) => r.id === id) ?? REPORTS[1])
export const fetchScan = (id: string) => wait(REPORTS.find((r) => r.id === id) ?? REPORTS[0])

export const fetchGitHubRepos = (): Promise<GitHubRepo[]> =>
  wait([
    { id: 1, fullName: 'acme/payments-api', private: true, defaultBranch: 'main', lastScan: daysAgo(1), connected: true },
    { id: 2, fullName: 'acme/web-frontend', private: true, defaultBranch: 'main', lastScan: daysAgo(2), connected: true },
    { id: 3, fullName: 'acme/legacy-billing', private: true, defaultBranch: 'master', connected: false },
    { id: 4, fullName: 'acme/marketing-site', private: false, defaultBranch: 'main', connected: false },
    { id: 5, fullName: 'acme/internal-tools', private: true, defaultBranch: 'develop', connected: false },
  ])

export const fetchTeam = (): Promise<TeamMember[]> =>
  wait([
    { id: 't1', name: '김한세', email: 'hanse@acme.io', role: 'OWNER', status: 'ACTIVE' },
    { id: 't2', name: '이도현', email: 'dohyun@acme.io', role: 'ADMIN', status: 'ACTIVE' },
    { id: 't3', name: '박지민', email: 'jimin@acme.io', role: 'MEMBER', status: 'ACTIVE' },
    { id: 't4', name: '최유진', email: 'yujin@acme.io', role: 'MEMBER', status: 'INVITED' },
  ])

export const SEVERITY_META: Record<Severity, { label: string; color: string }> = {
  CRITICAL: { label: 'Critical', color: 'var(--color-sev-critical)' },
  HIGH: { label: 'High', color: 'var(--color-sev-high)' },
  MEDIUM: { label: 'Medium', color: 'var(--color-sev-medium)' },
  LOW: { label: 'Low', color: 'var(--color-sev-low)' },
  INFO: { label: 'Info', color: 'var(--color-sev-info)' },
}

export const MODE_META: Record<ScanMode, { tag: string; label: string; color: string; soft: string; icon: 'globe' | 'box' | 'git-pull-request' }> = {
  WEBSITE: { tag: 'DAST', label: '웹사이트', color: 'var(--color-scan-web)', soft: 'var(--color-brand-soft)', icon: 'globe' },
  GITHUB_REPO: { tag: 'SAST', label: '레포 전체', color: 'var(--color-scan-code)', soft: 'var(--color-purple-soft)', icon: 'box' },
  GITHUB_ACTIONS: { tag: 'Actions', label: 'PR 분석', color: 'var(--color-scan-pr)', soft: 'var(--color-success-soft)', icon: 'git-pull-request' },
}

import i18n from './i18n'

export function formatDateTime(iso: string) {
  const locale = i18n.language === 'en' ? 'en-US' : 'ko-KR'
  return new Date(iso).toLocaleString(locale, {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}
export function relativeTime(iso: string) {
  const diff = Date.now() - +new Date(iso)
  const h = Math.floor(diff / 3600000)
  if (i18n.language === 'en') {
    if (h < 1) return 'just now'
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }
  if (h < 1) return '방금 전'
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}
export function won(n: number) {
  return '₩' + n.toLocaleString(i18n.language === 'en' ? 'en-US' : 'ko-KR')
}
