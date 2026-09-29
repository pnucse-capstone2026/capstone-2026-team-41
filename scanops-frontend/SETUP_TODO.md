# ScanOps Frontend — 직접 해야 할 일 (Manual Setup)

V3 프론트엔드는 **목 데이터 + 목 인증**으로 전 화면이 동작합니다. 실제 서비스로
연결할 때 직접 발급/설정해야 하는 것만 정리했습니다.

배포 도메인 (현재):
- 프론트: `https://scanops-frontend.vercel.app` (Vercel)
- 백엔드: `https://scanops-backend-production.up.railway.app` (Railway)

---

## 1. 백엔드 API 연결
- **Vercel 환경변수**에 `VITE_API_BASE_URL=https://scanops-backend-production.up.railway.app` 설정.
  (로컬 기본값은 `http://localhost:8080`.)
- 목 데이터 접근자는 `src/shared/lib/mock.ts`에 모여 있습니다. 실제 엔드포인트가
  생기면 이 함수들(`fetchScans`, `fetchReport`, `fetchUsage`, `fetchGitHubRepos`,
  `fetchTeam`)의 본문을 `shared/api/httpClient`의 `http()` 호출로 교체하세요.
  **반환 타입이 곧 백엔드 계약**입니다.

## 2. GitHub 로그인 (OAuth App) — ✅ 구현 완료, 토큰·환경변수만
백엔드(Spring Security OAuth2)·프론트 모두 **구현되어 있습니다.** 남은 건 OAuth App 등록과
환경변수 주입뿐입니다.

(1) GitHub Settings → Developer settings → **OAuth Apps → New OAuth App**
- Application name: `ScanOps`
- Homepage URL: `https://scanops-frontend.vercel.app`
- **Authorization callback URL** (그대로 입력):
  `https://scanops-backend-production.up.railway.app/login/oauth2/code/github`
  → 이건 Spring Security가 자동 생성하는 콜백 경로라 우리가 따로 만들 필요 없습니다.

(2) **Railway(백엔드) 환경변수**:
- `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET` (위에서 발급)
- `JWT_SECRET` (32바이트 이상 랜덤 문자열)
- `FRONTEND_URL=https://scanops-frontend.vercel.app`

(3) **Vercel(프론트) 환경변수**: `VITE_API_BASE_URL=https://scanops-backend-production.up.railway.app`

동작 흐름(이미 코드에 구현됨): 프론트 "GitHub로 계속하기" → `${API}/oauth2/authorization/github`
→ GitHub 동의 → 백엔드 콜백에서 code↔token 교환 → **JWT 발급** →
`${FRONTEND}/auth/github/callback?token=…`로 리다이렉트 → 프론트가 `/api/auth/me`로 프로필 로드.
- 백엔드: `com.scanops.auth`(JwtService·OAuth2SuccessHandler·AuthController), `SecurityConfig`
- 프론트: `shared/lib/auth.tsx`(`loginWithToken`), `pages/auth-callback`, `shared/lib/config.ts`
- 로컬(백엔드 없이)에선 `/auth/github/callback`에 token이 없으면 목으로 폴백.
- (선택) 이메일/비번 로그인은 아직 목입니다 — 필요 시 백엔드 엔드포인트 추가.

## 3. GitHub App (PR 자동 분석) — ✅ 이미 생성됨, 설정만
앱은 이미 만들어 두셨습니다: **`scanops-security-scanner`**
(`https://github.com/apps/scanops-security-scanner`).
- 프론트의 "App 설치" 버튼은 설치 URL
  `https://github.com/apps/scanops-security-scanner/installations/new`로 이미 연결됨
  (`src/shared/lib/config.ts`).
- 남은 설정(앱 콘솔에서): **Webhook URL**을 백엔드로 지정
  (`https://scanops-backend-production.up.railway.app/<webhook 경로>`), Webhook Secret 설정,
  권한 — Repository contents(read), Pull requests(read/write), Checks(write).
- 설치 후 백엔드가 installation token으로 PR 코멘트·체크 상태를 작성합니다.

## 4. 소유권 인증 — ✅ 구현 완료
- **도메인(DAST, .well-known)**: 백엔드 실구현 — `POST /api/verify/domain`(토큰 발급),
  `POST /api/verify/domain/confirm`(백엔드가 `https://<도메인>/.well-known/scanops-verify.txt`를
  직접 fetch해 토큰 대조). 프론트 `ScanForm`이 인증 전 스캔 버튼을 막고 안내 UX 제공.
  → 테스트하려면 **본인이 제어하는 도메인**에 그 파일을 올려야 통과합니다(보안상 정상).
- **GitHub 레포(SAST)**: 로그인한 GitHub 계정 소유 레포면 확인됨. 조직 레포/타인 레포는
  GitHub App(`scanops-security-scanner`) 설치로 접근 — App 설치 버튼 연결돼 있음.
- 남은 과제(스캐너 쪽): ZAP은 기본적으로 비로그인 공개 페이지만 스캔 → 로그인 후 페이지는
  ZAP 세션/인증 설정 별도, 큰 사이트는 scan policy 조정(불필요 공격 룰 off)으로 시간 단축.

## 5. 결제 (PG) — ⏸️ 보류
사업자등록이 필요해 당장은 보류. `src/pages/checkout/ui/CheckoutPage.tsx`는 목 결제 상태로
유지됩니다. 나중에 토스페이먼츠/포트원 등 PG 위젯으로 교체하세요.

---

## 이미 처리된 것 (할 일 아님)
- **폰트**: Pretendard 적용 완료 (`index.html`의 jsdelivr CDN). 별도 작업 불필요.
- **GitHub App 생성**: `scanops-security-scanner` 생성 완료(위 3번은 설정만).

## 참고: 구조
- 컴포넌트 `src/shared/ui/` · 아이콘 전부 [Feather](https://feathericons.com)(`Icon.tsx`)
- 외부 URL/상수 `src/shared/lib/config.ts`
- 인증/세션 `src/shared/lib/auth.tsx`(localStorage 목) · `ProtectedRoute`
- 목 데이터 단일 소스 `src/shared/lib/mock.ts` · 라우트 `src/app/router.tsx`
- 데모: 아무 이메일/비번이나 입력하면 로그인됨(목). GitHub 버튼도 즉시 연결됨.
