# ScanOps — Railway → AWS 마이그레이션 가이드

> **핵심 요약: 코드 수정은 거의 없다. 전부 "환경변수 + 배포 설정"이다.**
> ZAP 연동, 모델 호출 등은 이미 환경변수로 추상화돼 있어서 Java/Python 코드는 안 건드려도 된다.
> 바로 실행하려면 → [`docker-compose.aws.yml`](./docker-compose.aws.yml) + [`.env.aws.example`](./.env.aws.example)
>
> **구조·비용 근거와 컴포넌트별 AWS 선택은** → [`AWS_PLAN_백엔드전달.md`](./AWS_PLAN_백엔드전달.md) (이 문서는 실제 배포/환경변수/네트워크 레퍼런스)

---

## 1. 시스템 구성 (서비스 7개)

| 서비스 | 기술 | 포트 | 역할 | 외부 노출 |
|---|---|---|---|---|
| frontend | React (Vercel 유지 가능) | - | UI | ✅ |
| **backend** | Spring Boot · Java 17 | 8080 | 인증·API·스캔 오케스트레이션 | ✅ (이것만) |
| model-server | FastAPI · Python 3.11 | 8100 | AI 분석·RAG·코드그래프 | ❌ 내부 |
| ollama | Ollama | 11434 | LLM(GGUF) 구동 | ❌ 내부 |
| qdrant | Qdrant | 6333 | 벡터 DB(CVE) | ❌ 내부 |
| postgres | PostgreSQL | 5432 | 백엔드 DB | ❌ 내부 |
| zap | OWASP ZAP | 8090 | DAST 스캐너 | ❌ **절대 외부 금지** |

**흐름:** `프론트 → backend(8080) → model-server(8100) → ollama(11434)+qdrant(6333)`,
그리고 `backend → zap(8090)`, `backend → postgres`.

---

## 2. 코드 수정 — 사실상 없음 ✅

전부 환경변수로 되어 있어 **값만 바꾸면 된다:**
- `ZAP_HOST` → `http://zap:8090` (compose 내부 서비스명)
- `SCANOPS_MODEL_URL` → `http://model-server:8100`
- DB 접속값 → RDS 쓰면 RDS 엔드포인트

`ZapClient.java`(`@Value("${zap.host}")`), `ScanopsModelClient.java`(`@Value("${scanops.model.url}")`)
모두 env 주입이라 손댈 필요 없음.

---

## 3. 환경변수 전체

→ [`.env.aws.example`](./.env.aws.example) 복사해서 `.env.aws`로 채우면 됨. 핵심만:

**backend**
```
JDBC_DATABASE_URL, PGUSER, PGPASSWORD      # DB (RDS면 RDS값)
SCANOPS_MODEL_URL=http://model-server:8100
SCANOPS_API_KEY                            # 모델서버와 공유 시크릿
ZAP_HOST=http://zap:8090, ZAP_API_KEY
OPENAI/CLAUDE/GEMINI_API_KEY               # AI 폴백(선택)
GITHUB_APP_ID/PRIVATE_KEY/WEBHOOK_SECRET   # PR 스캔
CORS_ALLOWED_ORIGINS                       # 프론트 도메인
```
**model-server**
```
QDRANT_URL=http://qdrant:6333, QDRANT_COLLECTION=cve_vulnerabilities
OLLAMA_URL=http://ollama:11434/api/generate
OLLAMA_MODEL=qwen2.5-coder-security-v11    # 코드 기본값. 다르면 이 env로 override
OLLAMA_BASE_MODEL=qwen2.5-coder:3b         # RAG 폴백 base 모델
SCANOPS_API_KEY                            # backend와 동일
XAI_API_KEY                                # Grok 번역/폴백(선택)
```

---

## 4. 사용 모델

- **production: `qwen2.5-coder-security-v11` (3B, Q4 GGUF ~3GB)** — 탐지력·CWE 식별 대폭 향상.
- 코드 기본값 갱신 완료(2026-06-29): `api_server.py`·`rag.py`가 v11/3B를 기본으로 쓰고 env로 override 가능.
  - `OLLAMA_MODEL` (기본 `qwen2.5-coder-security-v11:latest`)
  - `OLLAMA_BASE_MODEL` (기본 `qwen2.5-coder:3b`)
- **서빙은 GPU on-demand 권장.** CPU로도 구동되지만(Q4 양자화), 스캔이 4~5배 느림. on-demand에선 GPU가 스캔당 비용도 더 쌈 → §5 참고.

---

## 5. AWS 구성 — 3블록 (상시 1 + on-demand 2)

**"항상 켜둘 가벼운 것은 작은 박스에 합치고, 스캔 때만 도는 무거운 것은 켰다 끈다."**

```
[상시 ON · 작은 박스]              [스캔 때만 ON · on-demand]
┌────────────────────────┐        ┌─────────────────────────────┐
│ backend / postgres /   │  스캔시 │ model-server + ollama       │
│ qdrant   (t3.small/med)│ ─기동→ │ (GPU · g4dn.xlarge)         │
│                        │  스캔시 │ ZAP (CPU · c5.large/Fargate)│
└────────────────────────┘ ─기동→ └─────────────────────────────┘
```

| 블록 | 담는 것 | 가동 | 인스턴스 | 비용 |
|---|---|---|---|---|
| **A 상시** | backend + postgres + qdrant | 24시간 | `t3.medium`(2vCPU/4GB) ※t3.small이면 ~$20 | ~$35/월 |
| **B 모델** | model-server + ollama | 스캔 시만 | `g4dn.xlarge`(T4 16GB), **spot 권장** | 가동분만 ~$3/월 |
| **C ZAP** | zap | 스캔 시만 | `c5.large` 또는 Fargate | 가동분만 ~$2/월 |

**평상시 합계 ~$40~45/월** (+ EBS 30GB ~$3).

- **왜 GPU on-demand?** 스캔은 켰다 끄는 작업이라, GPU가 시간당 비싸도 추론이 4~5배 빨리 끝나 **스캔당 비용은 오히려 더 쌈**(GPU ~$0.032 vs CPU ~$0.052/scan). spot이면 ~70% 추가 절감.
- **왜 B·C 분리?** ZAP은 GPU 안 쓰는 CPU 작업이고 길게 돎 → GPU 박스에 합치면 비싼 GPU가 노는 동안 과금. 따로 둠. (backend와 ZAP도 박스가 달라 스캔이 backend를 안 막음.)
- **콜드 스타트**: 부팅+모델 로딩 1~3분(PR/SAST는 비동기라 OK). GPU 박스는 terminate 말고 **stop**으로 꺼야 모델·EBS 유지되어 재기동 빠름. 더 빠르게는 모델 구운 커스텀 AMI 사용.
- OS: **Ubuntu 22.04**, 디스크 **30GB+**, 리전 **ap-northeast-2(서울)**.
- (대안) 운영 단순함이 최우선이면 **t3.xlarge 한 대에 전부 CPU, 24시간**(~$120/월, 예약 $75)도 가능하나 더 비싸고 스캔 ~6분으로 느림.

---

## 6. Ollama 모델 등록 (최초 1회)

기존 dev compose엔 Ollama가 없었음(로컬 brew). AWS는 컨테이너로 추가됨(`docker-compose.aws.yml`).
**블록B(GPU) 박스에서** GGUF 파일(`qwen-security-v11.Q4_K_M.gguf`)과 `Modelfile`을 `scanops-infra/models/`에 두고:
```bash
docker compose -f docker-compose.aws.yml exec ollama \
  ollama create qwen2.5-coder-security-v11 -f /models/Modelfile_v11
```
(Modelfile은 scanops-model 레포 `models/Modelfile_v11` 참고)

---

## 7. ⚠️ ZAP — 비용·보안 최대 주의

- **메모리/CPU 폭식**: 능동 스캔 1건 1~2GB + CPU 100%, 수분~수십분. backend·모델과 같은 박스면 스캔 중 다 느려짐.
- **기본(권장)**: ZAP은 **블록C로 분리**해 on-demand(스캔 시 기동→종료). `c5.large` EC2 또는 ECS Fargate 태스크. 동시 스캔 제한(플랜별 DAST 횟수)도 안전장치로 둠.
- **🔒 보안 필수**: ZAP API(8090)는 API 키 1개뿐 → **외부 절대 노출 금지**. compose에 `ports` 매핑 안 함(내부 전용).

---

## 8. 네트워크 / 보안그룹

```
[인바운드]
22 (SSH)         : 본인 IP만
80/443 (HTTP/S)  : 0.0.0.0/0 → ALB/nginx → backend(8080)
8080·8090·8100·11434·6333·5432 : 외부 차단 (내부 통신만)

[아웃바운드]
443 : NVD/GitHub/외부 LLM API
ZAP : 고객 도메인 스캔용 (소유권 인증 통과 도메인만)
```

---

## 9. 배포 순서

1. **블록A** EC2(t3.medium, Ubuntu 22.04, 30GB) 생성 + Docker/Compose 설치
2. 세 레포 같은 부모 폴더에 clone (`scanops-infra`, `scanops-backend`, `scanops-model`), `scanops-infra/.env.aws` 작성
3. 블록A: `backend + postgres + qdrant`만 compose up (`docker compose -f docker-compose.aws.yml --env-file .env.aws up -d --build <서비스명>`)
4. **블록B** GPU AMI 준비(g4dn, 모델 구운 스냅샷) + Ollama 모델 등록(§6) / **블록C** ZAP 이미지
5. Qdrant에 CVE 적재(`python -m scanops.data.prepare`)
6. backend에 블록B·C **start/stop 오케스트레이션**(스캔 시 기동→유휴 시 종료, `boto3`) 추가
7. 보안그룹: 80/443만 외부, 나머지 내부 전용
8. 도메인 + ALB(또는 nginx) + HTTPS(ACM 인증서)
9. 프론트 `VITE_API_URL` → AWS backend 주소로 변경 (코드 수정 없음)
10. (안정화 후) Postgres → **RDS**, ZAP → **Fargate**, 모델 → **AWS Batch** 자동화

---

## 10. 자주 헷갈리는 점

- **dev용 `docker-compose.yml`**(dvwa 포함, 로컬 테스트용)은 그대로 두고, **운영은 `docker-compose.aws.yml`** 사용.
- **Neo4j**는 현재 안 씀(코드가 인메모리 그래프로 폴백). 나중에 그래프 시각화 붙일 때 Aura 연동 + `NEO4J_URI` 추가.
- backend와 model-server의 **`SCANOPS_API_KEY`는 반드시 동일** (PR 스캔 인증).
