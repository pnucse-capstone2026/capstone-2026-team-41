/**
 * App-level external URLs / config. Centralized so deployment changes touch
 * one place. See SETUP_TODO.md for what each requires.
 */

// 이미 생성된 ScanOps GitHub App (PR 자동 분석)
export const GITHUB_APP_SLUG = 'scanops-security-scanner'
export const GITHUB_APP_INSTALL_URL = `https://github.com/apps/${GITHUB_APP_SLUG}/installations/new`

// 배포 도메인 (참고용)
export const FRONTEND_URL = 'https://scanops-frontend.vercel.app'
export const BACKEND_URL = 'https://scanops-backend.kr'

// 백엔드 API 베이스 (env 우선, 없으면 로컬)
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

// 요금제/결제 기능 노출 여부. 같은 레포를 연결한 별도 Vercel 프로젝트(다른 도메인)에서
// VITE_ENABLE_PRICING=false 로 설정하면 요금제 라우트·네비게이션·랜딩 섹션이 전부 숨겨진다.
// 값을 지정하지 않으면(기존 배포) 기본값 true — 기존 동작 그대로 유지.
export const ENABLE_PRICING = import.meta.env.VITE_ENABLE_PRICING !== 'false'
// GitHub OAuth 로그인 시작점 — Spring Security 기본 authorization 엔드포인트.
// 여기로 이동하면 GitHub 동의 → 백엔드 콜백(/login/oauth2/code/github) → 프론트로 토큰 리다이렉트.
export const GITHUB_AUTHORIZE_URL = `${API_BASE}/oauth2/authorization/github`
// GitHub 계정 "연동" 시작점 — 이미 로그인한 사용자의 토큰을 붙여 이동하면,
// 백엔드가 현재 계정에 GitHub을 연결(같은 계정)한 뒤 프론트로 토큰 리다이렉트.
export const githubLinkUrl = (token: string) =>
  `${API_BASE}/api/auth/github/link?token=${encodeURIComponent(token)}`
