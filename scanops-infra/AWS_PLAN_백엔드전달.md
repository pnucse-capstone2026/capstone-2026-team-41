# ScanOps — AWS 마이그레이션 플랜 (백엔드 담당자 전달용)

> 작성: 2026-06-29 · 대상: 백엔드/인프라 담당
> **한 줄 요약:** Railway 6개 서비스를 AWS로 옮긴다. **"항상 켜둘 가벼운 것(backend·DB·qdrant)"은 작은 EC2 한 대에 합치고, "스캔 때만 도는 무거운 것"은 요청 올 때만 켰다 끈다.** 모델은 **GPU(g4dn) on-demand** — CPU보다 4~5배 빠르면서 스캔당 비용은 오히려 더 쌈. 평상시 월 **~$40~45**.

---

## 0. 왜 옮기나 / 왜 GPU인가

**왜 Railway를 떠나나:**
1. **RAM 8GB 하드 천장.** 3B 모델(~3GB) + base 폴백 모델 + 임베더(~0.5GB) + Qdrant 다 올리면 초과.
2. **공유 vCPU라 3B 추론이 느림** → 타임아웃 위험.

**CPU냐 GPU냐 → GPU 쓴다.**
- 기존에 CPU로 돌린 건 Railway엔 GPU가 없고, 벤치마크를 재현성(temp=0) 위해 CPU로 한 것뿐. "CPU가 최적"이라서가 아님.
- 스캔은 **on-demand(켰다 끔)** 라서, GPU가 시간당 단가는 비싸도 **스캔이 4~5배 빨리 끝나** 결제 시간이 줄어 → **스캔당 비용이 오히려 더 싸다.**

| | 시간당 | 스캔 1건 wall-clock | per-scan 비용 |
|---|---|---|---|
| CPU (c6i.2xlarge) | ~$0.40 | 부팅90s+로드20s+추론~6분 ≈ 7.8분 | ~$0.052 |
| **GPU (g4dn.xlarge)** | ~$0.55 | 부팅90s+로드30s+추론~1.5분 ≈ 3.5분 | **~$0.032** |

→ **GPU가 더 빠르고 + 스캔당 더 쌈.** spot 인스턴스 쓰면 ~70% 추가 절감(스캔은 재시도 가능 → spot 적합).

---

## 1. 현재 구성 (Railway, 6서비스)

frontend(Vercel) · **backend**(Spring Boot, Java17) · model-server(FastAPI) · ollama · qdrant · postgres · zap

**호출 흐름:** `프론트 → backend(8080) → model-server(8100) → ollama(11434)+qdrant(6333)`,  `backend → zap(8090)`, `backend → postgres`

> ⚠️ 외부 노출은 **backend(8080)만.** 나머지(특히 ZAP 8090)는 전부 내부 전용.

---

## 2. RAG 구조 (코드 확인 완료 — 사실)

진짜 RAG 맞음. model-server가 다음을 사용:

| 요소 | 코드 | 메모리 |
|---|---|---|
| 임베더 | `BAAI/bge-small-en-v1.5` (sentence-transformers, 384d) | torch 포함 ~0.5GB |
| 벡터DB | Qdrant (`QDRANT_URL`), CVE ~792건 | ~0.5GB |
| LLM | Ollama Q4 GGUF (`OLLAMA_MODEL`) | 3B Q4 ~3GB |

추론 파이프라인(`run_adaptive`): ① 파인튜닝 모델 1차 탐지 → ② 실패 시 **base+RAG 폴백**(Qdrant 유사 CVE 검색→컨텍스트 보강) → ③ 코드그래프 taint 검증.

> ✅ 모델명 코드 수정 완료(2026-06-29): `api_server.py`·`rag.py` 기본값을 v11/3B로 갱신하고 env로 override 가능하게 바꿈.
> - `OLLAMA_MODEL` (기본 `qwen2.5-coder-security-v11:latest`)
> - `OLLAMA_BASE_MODEL` (기본 `qwen2.5-coder:3b`)
> - 남은 `qwen2.5-coder:1.5b`는 CLI/벤치마크 옵션 기본값뿐(운영 무관).

---

## 3. 목표 아키텍처 — 3블록 (상시 1 + on-demand 2)

```
[상시 ON · 작은 박스]              [스캔 때만 ON · on-demand]
┌────────────────────────┐        ┌─────────────────────────────┐
│ backend / postgres /   │  스캔시 │ model-server + ollama       │
│ qdrant   (t3.small/med)│ ─기동→ │ (GPU · g4dn.xlarge)         │
│                        │        └─────────────────────────────┘
│                        │  스캔시 ┌─────────────────────────────┐
│                        │ ─기동→ │ ZAP (CPU · c5.large / Fargate)│
└────────────────────────┘        └─────────────────────────────┘
```

### 블록 A · 상시 가동 (24시간, 싸게)
`backend + postgres + qdrant` 한 박스에 docker-compose로 묶음. 셋 다 가볍고 항상 떠 있어야 함.

### 블록 B · 모델 (스캔 때만, GPU)
`model-server(FastAPI+임베더) + ollama` 한 박스. 스캔 요청 시 기동→유휴 시 종료. GPU라 추론 빠름.

### 블록 C · ZAP (스캔 때만, CPU)
`zap` 단독. **B와 분리하는 이유:** ZAP은 GPU를 안 쓰고 길게 도는 CPU 작업 → GPU 박스에 합치면 비싼 GPU가 노는 동안 과금됨. 따로 CPU on-demand로.

> ✅ "backend와 ZAP 분리" 요구 충족 — 박스 자체가 다름. 스캔이 backend 응답을 잡아먹지 않음.

---

## 4. 컴포넌트별 AWS 서비스 선택

| 컴포넌트 | 지금(MVP·저비용) | 어떤 AWS 구조 | 확장 시 |
|---|---|---|---|
| **backend** (Spring Boot) | 블록A EC2 컨테이너 | EC2 + docker-compose. PaaS 원하면 **App Runner**(git push 자동배포·오토스케일) | **ECS Fargate** / App Runner 오토스케일 |
| **postgres** | 블록A 컨테이너 | docker postgres + EBS 볼륨 | **RDS for PostgreSQL**(백업·패치 자동). 변동부하면 Aurora Serverless v2 |
| **qdrant** | 블록A 컨테이너 | docker qdrant + EBS | 데이터 커지면 **메모리 최적화 EC2(r6i/r7g)** 분리 |
| **model**(ollama+model-server) | 블록B 온디맨드 **GPU** | `g4dn.xlarge`(T4 16GB), 스캔 시 start→유휴 stop, **spot 권장** | **EC2 Auto Scaling Group** 또는 **AWS Batch**(작업 큐→자동 확장). 부하 크면 `g5.xlarge`(A10G) |
| **zap** | 블록C 온디맨드 **CPU** | `c5.large`, 내부 전용(8090 외부 차단) | **ECS Fargate 태스크**(스캔 1건당 1태스크 띄우고 종료) |
| **frontend** | 현행 유지 | **Vercel** 그대로, `VITE_API_URL`만 AWS backend로 | 동일 |

**AWS 컴퓨트 3종 언제 쓰나 (요약):**
- **EC2** = 가상 서버 한 대. 직접 관리, 제일 유연·저렴. 지금 단계 기본.
- **App Runner** = 컨테이너만 주면 알아서 배포·오토스케일. Railway랑 가장 비슷.
- **ECS Fargate** = 서버리스 컨테이너, 작업 단위로 띄웠다 내림. ZAP 스캔처럼 "작업당 1개" 패턴에 최적.

---

## 5. on-demand "스캔 때만 켜기" 동작 방식

1. PR/SAST(또는 DAST) 스캔 요청이 backend로 들어옴
2. backend가 EC2 API(`boto3 start_instances`)로 **필요한 블록(B/C) 기동**
3. 모델/ZAP이 스캔 수행, 결과를 backend로 반환
4. 일정 시간(예: 10분) 유휴면 backend가 **자동 종료(`stop_instances`)**

⚠️ **콜드 스타트:** EC2 부팅 + GPU 드라이버 + 3B 모델 VRAM 로딩에 1~3분. PR/SAST는 비동기라 OK.
- **빠르게 하는 법:** 인스턴스를 terminate가 아니라 **stop**(EBS 유지)으로 → 모델 재다운로드 없이 부팅+로드만. 또는 **모델 미리 구운 커스텀 AMI** 사용 → 1분 내.

---

## 6. 자동 스케일 (사용자 늘면)

- **모델/ZAP → AWS Batch**: 스캔 작업을 큐에 넣으면 인스턴스를 자동으로 띄우고(스케일아웃) 끝나면 0으로 줄임. 동시 스캔 10건 와도 알아서. 수동 start/stop 불필요.
- **backend → ECS Fargate / App Runner**: 트래픽 따라 컨테이너 수 자동 증감.
- **DB 분리**: postgres→RDS, qdrant→전용 메모리 최적화 EC2.

코드(스캔 트리거→워커 호출)는 거의 그대로, 인프라만 교체.

---

## 7. 비용 추정 (서울 ap-northeast-2, 온디맨드 대략)

| 항목 | 사양 | 비용 |
|---|---|---|
| 블록A 상시 | t3.medium (2vCPU/4GB) ※t3.small이면 ~$20 | ~$35/월 |
| EBS 스토리지 | 30GB gp3 | ~$3/월 |
| 블록B 모델 GPU | g4dn.xlarge, 가동분만 (100스캔×3.5분) | **~$3/월** (spot이면 ~$1) |
| 블록C ZAP | c5.large, 가동분만 | **~$2/월** |
| **합계(평상시)** | | **~$40~45/월** |

> 비교: 기존 AWS_MIGRATION.md의 "t3.xlarge 한 대 24시간 CPU"는 ~$120/월(예약 $75)에 스캔도 ~6분으로 느림. 이 안은 **더 싸고 + 스캔 4~5배 빠름.** 단 start/stop 오케스트레이션과 콜드스타트가 추가 작업.

---

## 8. 도커/배포 — 지금 진행해도 OK

- Dockerfile 다 있음: backend(multi-stage Spring), model, zap + `docker-compose.aws.yml`.
- **Dockerfile은 빌드 시 소스를 컴파일** → 백엔드 코드 계속 고쳐도 Dockerfile 안 건드리고 재빌드만 하면 됨.
- **DB 스키마 변경은 런타임(JPA)** → 이미지에 안 박힘. postgres→RDS도 `JDBC_DATABASE_URL` 환경변수만 교체(이미 추상화됨).
- Dockerfile 수정 필요한 경우는 **새 시스템 의존성 / 새 환경변수 / 새 포트** 뿐.

→ **인프라 세팅을 먼저 끝내두고, 백엔드/DB 코드는 병렬로 진행** 가능. 서로 안 막음.

---

## 9. 배포 순서 (요약)

1. 블록A EC2(t3.medium, Ubuntu 22.04, 30GB) 생성 + Docker/Compose
2. 세 레포 clone, `.env.aws` 작성
3. 블록A: `backend + postgres + qdrant` compose up
4. 블록B GPU AMI 준비(모델 구운 스냅샷) + 블록C ZAP 이미지
5. backend에 블록 start/stop 로직 + Ollama 모델 등록(v11) + Qdrant CVE 적재
6. 보안그룹: 80/443만 외부, 나머지 내부 전용
7. 도메인 + ALB/nginx + HTTPS(ACM)
8. 프론트 `VITE_API_URL` → AWS backend
9. (안정화 후) postgres→RDS, ZAP→Fargate, 모델→Batch 자동화

---

## 10. 주의

- **ZAP API(8090) 외부 절대 노출 금지** — API 키 1개뿐. compose에 ports 매핑 안 함.
- backend ↔ model-server **`SCANOPS_API_KEY` 동일**해야 함(PR 스캔 인증).
- `SCANOPS_MODEL_URL`, `ZAP_HOST`, `QDRANT_URL`, `OLLAMA_URL` 전부 환경변수 → 박스 분리해도 값만 바꾸면 됨.
- GPU 박스(블록B)는 **stop으로 꺼야**(terminate 아님) 모델·EBS 유지되어 콜드스타트 빠름.
