# scanops-infra

ScanOps 인프라 — Docker Compose (로컬) + Railway (ZAP 배포)

---

## 구성 서비스

| 서비스 | 이미지 | 포트 | 환경 |
|--------|--------|------|------|
| ZAP | `ghcr.io/zaproxy/zaproxy:stable` | 8090 | 로컬 + Railway |
| DVWA | `ghcr.io/digininja/dvwa:latest` | 4280 | 로컬 전용 |
| dvwa-db | `mariadb:10` | - (내부) | 로컬 전용 |
| postgres | `postgres:15` | 5433 | 로컬 + Railway 플러그인 |

> DVWA는 Railway 무료 티어 메모리 부족으로 로컬 전용입니다.

---

## Docker Compose 전체 구성

```yaml
services:
  zap:
    image: ghcr.io/zaproxy/zaproxy:stable
    command: >
      zap.sh -daemon -host 0.0.0.0 -port 8090
      -config api.addrs.addr.name=.*
      -config api.addrs.addr.regex=true
      -config api.key=${ZAP_API_KEY}
    ports:
      - "8090:8090"
    networks:
      - scanops-net

  dvwa:
    image: ghcr.io/digininja/dvwa:latest
    ports:
      - "4280:80"
    environment:
      DB_SERVER: dvwa-db
      DB_PORT: 3306
      DB_DATABASE: dvwa
      DB_USER: dvwa
      DB_PASSWORD: dvwa
    depends_on:
      - dvwa-db
    networks:
      - scanops-net

  dvwa-db:
    image: mariadb:10
    environment:
      MARIADB_ROOT_PASSWORD: rootpassword
      MARIADB_DATABASE: dvwa
      MARIADB_USER: dvwa
      MARIADB_PASSWORD: dvwa
    volumes:
      - dvwa-db-data:/var/lib/mysql
    networks:
      - scanops-net

  postgres:
    image: postgres:15
    ports:
      - "5433:5432"   # 로컬 5433 → 컨테이너 5432
    environment:
      POSTGRES_DB: scanops
      POSTGRES_USER: scanops
      POSTGRES_PASSWORD: scanops
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - scanops-net

networks:
  scanops-net:
    driver: bridge

volumes:
  dvwa-db-data:
  postgres-data:
```

---

## 로컬 실행

### 전체 환경 시작

```bash
cp .env.example .env
docker compose up -d

# ZAP API 동작 확인
curl "http://localhost:8090/JSON/core/view/version/"
# → {"version":"2.15.x"}

# DVWA 초기화
# 브라우저 → http://localhost:4280
# Setup / Reset Database 클릭 → admin / password 로그인
```

### 개별 서비스 제어

```bash
# DB만 실행 (백엔드 개발 시)
docker compose up postgres -d

# 스캔 환경만 실행
docker compose up zap dvwa dvwa-db -d

# 전체 중지
docker compose down

# 전체 중지 + 볼륨 삭제 (데이터 초기화)
docker compose down -v
```

---

## ZAP 상세 설명

### ZAP이란?

OWASP ZAP(Zed Attack Proxy)은 오픈소스 웹 취약점 스캐너입니다.  
ScanOps는 ZAP을 **데몬 모드**로 실행하고 REST API를 통해 제어합니다.

### ZAP 데몬 실행 옵션

```bash
zap.sh -daemon \
  -host 0.0.0.0 \           # 모든 인터페이스에서 수신
  -port 8090 \               # API 포트
  -config api.addrs.addr.name=.* \     # 모든 IP에서 API 허용
  -config api.addrs.addr.regex=true \  # 정규식 매칭 활성화
  -config api.key=${ZAP_API_KEY}       # API 인증 키
```

Railway 배포용 `Dockerfile.zap`은 `api.disablekey=true`를 사용하여 API 키 없이 내부 네트워크 통신을 허용합니다.

---

## ZAP REST API 전체 명세

백엔드의 `ZapClient.java`가 호출하는 ZAP API 엔드포인트입니다.

### 1. URL 시딩 — accessUrl

```
GET /JSON/core/action/accessUrl/
  ?apikey={ZAP_API_KEY}
  &url=http://target.com
  &followRedirects=true

// Response
{"Result": "OK"}
```

ZAP이 직접 대상 URL에 HTTP 요청을 보내어 사이트 트리에 등록합니다.  
이후 Spider가 이 URL을 시작점으로 크롤링합니다.

---

### 2. Spider 스캔 — 수동 크롤링

Spider는 대상 사이트의 모든 링크를 재귀적으로 따라가며 URL을 수집합니다.

#### 스캔 시작

```
GET /JSON/spider/action/scan/
  ?apikey={ZAP_API_KEY}
  &url=http://target.com
  &recurse=true

// Response
{"scan": "1"}    ← scan ID (진행률 조회에 사용)
```

#### 진행률 조회 (5초 간격 폴링)

```
GET /JSON/spider/view/status/
  ?apikey={ZAP_API_KEY}
  &scanId=1

// Response
{"status": "75"}    ← 0~100 (100이면 완료)
```

---

### 3. Active 스캔 — 능동적 취약점 탐지

Spider가 수집한 URL들에 실제 공격 페이로드를 주입하여 취약점을 탐지합니다.  
(SQL Injection, XSS, CSRF 등 실제 공격 시뮬레이션)

#### 스캔 시작

```
GET /JSON/ascan/action/scan/
  ?apikey={ZAP_API_KEY}
  &url=http://target.com
  &recurse=true

// Response
{"scan": "0"}    ← scan ID
```

#### 진행률 조회 (5초 간격 폴링)

```
GET /JSON/ascan/view/status/
  ?apikey={ZAP_API_KEY}
  &scanId=0

// Response
{"status": "42"}    ← 0~100
```

Active 스캔은 Spider보다 훨씬 오래 걸립니다 (대상 사이트 규모에 따라 수분~수십분).

---

### 4. 알럿 수집 — 취약점 결과 조회

```
GET /JSON/core/view/alerts/
  ?apikey={ZAP_API_KEY}
  &baseurl=http://target.com

// Response
{
  "alerts": [
    {
      "alert": "SQL Injection",
      "risk": "High",
      "url": "http://target.com/vulnerabilities/sqli/?id=1",
      "param": "id",
      "description": "SQL injection may be possible. The page results were different when using...",
      "solution": "Do not trust client side input, even if there is client side validation in place...",
      "evidence": "1 AND 1=1",
      "cweId": "89",
      "wascId": "19"
    },
    {
      "alert": "Cross Site Scripting (Reflected)",
      "risk": "Medium",
      "url": "http://target.com/vulnerabilities/xss_r/?name=test",
      "param": "name",
      "description": "Cross-site Scripting (XSS) is an attack technique...",
      "solution": "Phase: Architecture and Design\nUse a vetted library or framework...",
      "evidence": "<script>alert(1);</script>",
      "cweId": "79",
      "wascId": "8"
    },
    {
      "alert": "Cookie No HttpOnly Flag",
      "risk": "Low",
      "url": "http://target.com/",
      "param": "PHPSESSID",
      "description": "A cookie has been set without the HttpOnly flag...",
      "solution": "Ensure that the HttpOnly flag is set for all cookies..."
    }
  ]
}
```

`risk` 값: `High` / `Medium` / `Low` / `Informational`

---

### 5. 버전 확인

```
GET /JSON/core/view/version/
  ?apikey={ZAP_API_KEY}

// Response
{"version": "2.15.0"}
```

---

## DVWA (Damn Vulnerable Web Application)

DVWA는 의도적으로 취약하게 만든 웹 애플리케이션으로, ZAP 스캔 테스트 대상으로 사용됩니다.

### 접속 정보

| 항목 | 값 |
|------|-----|
| URL | http://localhost:4280 |
| 기본 계정 | admin / password |
| DB 초기화 | Setup/Reset DB 클릭 필요 |

### 포함된 취약점 유형

| 취약점 | 경로 |
|--------|------|
| SQL Injection | `/vulnerabilities/sqli/` |
| Blind SQL Injection | `/vulnerabilities/sqli_blind/` |
| XSS (Reflected) | `/vulnerabilities/xss_r/` |
| XSS (Stored) | `/vulnerabilities/xss_s/` |
| CSRF | `/vulnerabilities/csrf/` |
| File Inclusion | `/vulnerabilities/fi/` |
| Command Injection | `/vulnerabilities/exec/` |
| File Upload | `/vulnerabilities/upload/` |

### ZAP으로 DVWA 스캔하기

Docker Compose 내부 네트워크에서 ZAP이 DVWA에 접근할 때는 컨테이너명을 사용합니다.

```
# Docker 내부 네트워크 URL
http://dvwa:80

# 백엔드에서 스캔 요청 시 (로컬 외부 접근)
POST /api/scans
{ "targetUrl": "http://localhost:4280", "ownerEmail": "test@example.com" }
```

---

## Railway ZAP 배포

ZAP은 `Dockerfile.zap`을 사용해 Railway에 별도 서비스로 배포합니다.

### Dockerfile.zap

```dockerfile
FROM ghcr.io/zaproxy/zaproxy:stable

CMD ["sh", "-c", "zap.sh -daemon \
     -host 0.0.0.0 \
     -port $PORT \
     -config api.addrs.addr.name=.* \
     -config api.addrs.addr.regex=true \
     -config api.disablekey=true"]

EXPOSE 8080
```

- `$PORT`: Railway가 자동으로 주입하는 포트 환경변수
- `api.disablekey=true`: Railway 내부 네트워크 통신이므로 API 키 불필요

### 배포 방법

1. [railway.app](https://railway.app) → 기존 Project → **Add Service**
2. **GitHub Repo** → `scanops-infra` 선택
3. Settings → **Dockerfile Path**: `Dockerfile.zap`
4. Variables 탭: 별도 환경변수 불필요 (`api.disablekey=true` 사용)
5. Deploy → 도메인 확인: `https://scanops-zap.up.railway.app`

백엔드 서비스의 `ZAP_HOST` 환경변수에 위 도메인을 설정합니다.

---

## 환경변수 (.env)

```bash
# ZAP API 키 (로컬에서 api.key 사용 시)
ZAP_API_KEY=your-zap-api-key

# PostgreSQL
POSTGRES_DB=scanops
POSTGRES_USER=scanops
POSTGRES_PASSWORD=scanops

# DVWA DB
DVWA_DB_USER=dvwa
DVWA_DB_PASSWORD=dvwa
DVWA_DB_ROOT_PASSWORD=rootpassword
```

---

## 보안 주의사항

- ZAP은 반드시 **스캔 동의를 받은 대상**에만 사용하세요
- Railway 배포 시 ZAP 포트는 Railway 내부 네트워크로만 통신 (백엔드 → ZAP)
- DVWA는 학습/테스트 환경 전용으로, **절대 외부 공개 금지**
- `docker compose down -v` 실행 시 스캔 데이터가 초기화됩니다
