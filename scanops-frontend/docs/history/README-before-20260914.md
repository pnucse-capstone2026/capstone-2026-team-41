# scanops-frontend

ScanOps 프론트엔드 — React 18 + TypeScript + Vite + Tailwind CSS

---

## 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| React | 18 | UI 라이브러리 |
| TypeScript | 5.x | 타입 안정성 |
| Vite | 6.x | 빌드 툴 / 개발 서버 |
| Tailwind CSS | v4 (`@tailwindcss/vite`) | 유틸리티 CSS |
| React Router | v6 | SPA 라우팅 |
| Recharts | - | 취약점 분포 차트 |
| FSD (Feature-Sliced Design) | - | 아키텍처 패턴 |

---

## FSD 아키텍처 구조

FSD는 레이어를 단방향 의존성으로 강제하는 아키텍처입니다.  
**상위 레이어는 하위 레이어에만 의존할 수 있습니다.** (pages → widgets → features → entities → shared)

```
src/
├── app/                    ← 앱 진입점, 라우터 설정
│   └── router.tsx
│
├── pages/                  ← 라우트별 페이지 컴포넌트
│   ├── landing/
│   │   └── ui/LandingPage.tsx       서비스 소개 + 스캔 시작 버튼
│   ├── scan/
│   │   └── ui/ScanPage.tsx          스캔 요청 폼 페이지
│   ├── scan-status/
│   │   └── ui/StatusPage.tsx        스캔 진행 상태 폴링 페이지
│   ├── report/
│   │   ├── ui/ReportPage.tsx        단일 스캔 상세 리포트 페이지
│   │   └── ui/vulnMeta.ts           취약점 메타 상수 (표시용)
│   └── reports/
│       └── ui/ReportsPage.tsx       전체 스캔 히스토리 목록 페이지
│
├── widgets/                ← 여러 entity/feature를 조합한 복합 UI 블록
│   ├── vuln-table/
│   │   └── ui/VulnTable.tsx         취약점 목록 테이블 (정렬, 필터)
│   └── vuln-chart/
│       └── ui/VulnChart.tsx         위험등급별 취약점 분포 Pie 차트
│
├── features/               ← 유저 액션 단위 (한 가지 기능)
│   └── scan-request/
│       ├── api/startScan.ts         스캔 생성 API 호출 함수
│       └── ui/ScanForm.tsx          URL + 이메일 입력 폼 컴포넌트
│
├── entities/               ← 비즈니스 엔티티 (도메인 모델 + API)
│   ├── scan/
│   │   ├── api/scanApi.ts           getScanJob, listReports API
│   │   └── model/types.ts           ScanJob, ScanStatus 타입 정의
│   └── vulnerability/
│       ├── api/reportApi.ts         getReport API
│       ├── model/types.ts           Vulnerability, Report, RiskLevel 타입
│       └── ui/AiGuideCard.tsx       AI 분석 결과 카드 컴포넌트
│
└── shared/                 ← 레이어에 무관한 공통 유틸
    ├── api/
    │   └── httpClient.ts            fetch 래퍼 (BASE_URL + Content-Type)
    └── ui/
        └── CvssGauge.tsx            CVSS 점수 게이지 시각화 컴포넌트
```

---

## 라우팅 구조

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | LandingPage | 서비스 소개, "스캔 시작" 버튼 → `/scan` 이동 |
| `/scan` | ScanPage | 대상 URL + 이메일 입력 → 스캔 생성 요청 |
| `/scan/:id/status` | StatusPage | 스캔 상태 폴링 (3초 간격), DONE 시 `/report/:id` 이동 |
| `/report/:id` | ReportPage | 취약점 상세 리포트 (차트 + 테이블 + AI 설명) |
| `/reports` | ReportsPage | 전체 스캔 히스토리 목록 |

---

## API 통신

### HTTP 클라이언트 (`shared/api/httpClient.ts`)

```typescript
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}
```

모든 API 호출은 `http()` 함수를 통해 이루어집니다. `VITE_API_BASE_URL` 환경변수로 백엔드 주소를 주입합니다.

---

### 스캔 생성 (`features/scan-request/api/startScan.ts`)

```typescript
// POST /api/scans
startScan({ targetUrl: 'http://target.com', ownerEmail: 'user@example.com' })

// Request Body
{
  "targetUrl": "http://target.com",
  "ownerEmail": "user@example.com"
}

// Response (ScanJob)
{
  "id": "550e8400-...",
  "targetUrl": "http://target.com",
  "status": "PENDING",
  "ownerEmail": "user@example.com",
  "verified": false,
  "createdAt": "2026-04-30T10:00:00",
  "finishedAt": null
}
```

### 스캔 상태 조회 (`entities/scan/api/scanApi.ts`)

```typescript
// GET /api/scans/{id}
getScanJob('550e8400-...')

// Response (ScanJob)
{
  "id": "550e8400-...",
  "status": "RUNNING",   // PENDING | RUNNING | DONE | FAILED
  ...
}
```

StatusPage에서 3초마다 폴링 → `status === 'DONE'`이면 리포트 페이지로 자동 이동

### 스캔 목록 조회

```typescript
// GET /api/scans
listReports()

// Response (ScanJob[])
[
  { "id": "...", "status": "DONE", "targetUrl": "...", ... },
  { "id": "...", "status": "RUNNING", "targetUrl": "...", ... }
]
```

### 리포트 조회 (`entities/vulnerability/api/reportApi.ts`)

```typescript
// GET /api/reports/{id}
getReport('550e8400-...')

// Response (Report)
{
  "targetUrl": "550e8400-...",
  "maxCvssScore": 9.8,
  "vulnerabilities": [
    {
      "id": "vuln-uuid",
      "jobId": "550e8400-...",
      "vulnType": "SQL Injection",
      "url": "http://target/vuln?id=1",
      "parameter": "id",
      "riskLevel": "HIGH",
      "cvssScore": 9.8,
      "cvssVector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
      "summary": "SQL 인젝션: 사용자 입력이 DB 쿼리에 직접 삽입",
      "description": "이 취약점은...",
      "solution": "PreparedStatement를 사용하세요...",
      "aiModel": "GPT",
      "createdAt": "2026-04-30T10:15:00"
    }
  ]
}
```

---

## 타입 정의

### ScanJob (`entities/scan/model/types.ts`)

```typescript
export type ScanStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED'

export interface ScanJob {
  id: string
  targetUrl: string
  status: ScanStatus
  ownerEmail: string
  verified: boolean
  createdAt: string
  finishedAt?: string
}
```

### Vulnerability & Report (`entities/vulnerability/model/types.ts`)

```typescript
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type AiModelType = 'GPT' | 'CLAUDE' | 'GEMINI' | 'CUSTOM'

export interface Vulnerability {
  id: string
  jobId: string
  vulnType: string
  url: string
  parameter: string
  riskLevel: RiskLevel
  cvssScore: number
  cvssVector: string
  summary: string
  description: string
  solution: string
  aiAnalysis: string
  aiModel: AiModelType
  createdAt: string
}

export interface Report {
  targetUrl: string
  maxCvssScore: number
  vulnerabilities: Vulnerability[]
}
```

---

## 로컬 실행

```bash
npm install
cp .env.example .env.local
# .env.local 에서 VITE_API_BASE_URL 수정
npm run dev
```

## Vercel 배포

1. [vercel.com](https://vercel.com) → New Project → `scanops-frontend` 선택
2. Framework Preset: **Vite** (자동 감지)
3. 환경변수 설정:
   ```
   VITE_API_BASE_URL = https://your-backend.up.railway.app
   ```
4. Deploy

> `vercel.json`의 rewrites 설정으로 SPA 라우팅(React Router)이 정상 동작합니다.

## 환경변수

| 변수 | 설명 |
|------|------|
| `VITE_API_BASE_URL` | 백엔드 API 베이스 URL (기본값: `http://localhost:8080`) |
