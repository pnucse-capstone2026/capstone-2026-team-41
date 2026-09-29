# ScanOps 온프레미스 배포 (외부 호출 0)

2026-08-17 실측 기준. 모든 수치는 실제 기동에서 잰 값이다.

## 1. 구성

| 서비스 | 포트 | 역할 | 판정 관여 |
|---|---|---|---|
| `model-api` (api_rebuild) | 8100 (노출) | 분석 API, 하이브리드 집계 | — |
| `llama-server` | 8080 (내부) | GGUF 추론 | **관여** (LLM 탐지) |
| `joern-worker` (`:final`) | 8200 (내부) | CPG taint 분석 | **미관여** (evidence 전용) |
| `postgres` | 5432 (내부) | 백엔드 DB | — |
| `backend` (Spring) | 8080 (노출) | REST/인증 | — |
| `qdrant` / `zap` | — | 선택 (`--profile qdrant` / `zap`) | 미관여 |

## 2. 기동

```bash
cp .env.onprem.example .env.onprem
# GGUF_DIR 를 GGUF 파일이 있는 실제 경로로 수정

# ⚠️ 프로젝트명(-p)을 반드시 지정한다.
#    이 디렉토리에는 다른 compose 파일도 있어 -p 없이 실행하면
#    기존에 떠 있는 컨테이너(dvwa/zap/postgres 등)와 같은 프로젝트로 묶이고,
#    down -v 시 그것들까지 지워진다.
docker compose -p scanops-onprem-demo -f docker-compose.onprem.yml \
  --env-file .env.onprem --profile llm up -d
```

정리:
```bash
docker compose -p scanops-onprem-demo -f docker-compose.onprem.yml down -v
```

## 3. 최소 사양 (실측, macOS M3 / Docker 할당 7.65GiB)

| 서비스 | 메모리 | cold start |
|---|---|---|
| llama-server (9B Q4_K_M) | **5.43 GiB** | ~60초 |
| joern-worker | 22.8 MiB (유휴), 분석 시 최대 8GB(`JOERN_MEM_LIMIT`) | ~20초 |
| model-api | 52.4 MiB | ~30초 |

**권장**: RAM 16GB, 디스크 20GB. 위 3개 서비스가 7.65GiB 할당에서 동시에 healthy 했다.

## 4. 외부 호출 차단

`.env.onprem`에서 다음을 **빈 값**으로 유지한다:
`RUNPOD_ENDPOINT_ID`, `RUNPOD_API_KEY`, `OPENAI_API_KEY`, `CLAUDE_API_KEY`,
`GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`,
`GITHUB_WEBHOOK_SECRET`, `GITHUB_TOKEN`.

`RUNPOD_ENDPOINT_ID`가 비면 `llm_client.use_runpod()`가 False가 되어
`LLAMA_SERVER_URL`(컨테이너 내부)로만 나간다 — `scanops/core/llm_client.py:30-36`.

## 5. 제한사항 (반드시 읽을 것)

1. **GitHub OAuth 로그인은 외부 접속이 필요하다.** 백엔드 `application.yml`의
   `redirect-uri`는 `.env`로 로컬 주소로 덮을 수 있지만, 로그인 흐름 자체가 github.com으로 간다.
   에어갭에서는 사내 IdP 또는 로컬 계정으로 대체해야 한다.
2. **GITHUB_REPO 스캔 모드는 온프레미스에서 쓸 수 없다**(외부 clone 필요).
   `POST /analyze`(model-api 직접 호출) 또는 로컬 경로 기반 스캔을 써야 한다.
3. **판정 모델은 GGUF 파일에 달렸다.** `GGUF_FILE`이 파인튜닝 어댑터 머지 모델이 아니면
   4줄 판정 서식이 나오지 않아 전부 미탐이 된다(실측 — `demo/NOTES.md`).
4. `tmpfs: /tmp`는 반드시 **`exec`** 여야 한다. `noexec`면 Joern이 zstd를 실행하지 못해
   모든 분석이 `unknown`이 된다(실측).

## 6. macOS 로컬 개발 (컨테이너 아님)

Homebrew joern은 JS 프론트엔드용 astgen 경로가 비어 있어 JS가 전부 parse_fail 이다.
컨테이너에는 이 문제가 없다(이미지에 `astgen-linux` 포함 확인).

```bash
../scanops-model/joern/setup_local.sh status
../scanops-model/joern/setup_local.sh install   # 링크 생성
../scanops-model/joern/setup_local.sh remove    # 제거
```
