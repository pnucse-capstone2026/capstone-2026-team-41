# 데모 응답 3건 (프로덕션 모델) — 2026-08-17

## 실행 조건

| | 어제(`response_{a,b,c}.json`) | **오늘(`_fix`)** |
|---|---|---|
| LLM | 베이스 `Qwen3.5-9B-Q4_K_M` (어댑터 없음) | **베이스 + `adapter_v1_fix.gguf` (v1 QLoRA)** |
| 어댑터 출처 | — | `rebuild/out/adapter/` → `llama.cpp/convert_lora_to_gguf.py` (58.2MB) |
| 검증 | — | 내부 test 20건 예측 일치율 **95.0%**(19/20), 파싱 **100%** (`rebuild/out/lora_verify_fix.log`) |
| Joern | `/tmp` noexec 로 전부 unknown | 정상 (`/tmp:size=4g,exec`) |

SHA256 — 베이스 `03b74727a860a56338e042c4420bb3f04b2fec5734175f4cb9fa853daf52b7e8`,
어댑터 `a35c9b086127e48bf2c01a4b14b3d21f8063cabdd09f14401654e330b735c2c7`.

## 결과 비교

| 샘플 | 어제 detected | **오늘 detected** | 오늘 vulnerability | joern flow | 어제 elapsed | **오늘 elapsed** |
|---|---|---|---|---|---|---|
| (a) Java SQLi | false | **true** | CWE-89 | **6스텝** | 77.4s | **20.0s** |
| (b) Python cmdi | false | **true** | CWE-78 | 0스텝(safe) | 142.4s | **21.6s** |
| (c) Java 안전(PreparedStatement) | false | **false** | NONE | 5스텝 | 174.4s | **16.3s** |

세 건 모두 `source="llm"`, `status="DONE"`, `joern_evidence.advisory_only=true`.
`parse_retried`는 3건 모두 미발생(첫 호출에서 4줄 서식이 나왔다).

## 읽을 때 주의

- **(c)에서 Joern은 여전히 `vuln`(5스텝)을 낸다.** `PreparedStatement.setString` 흐름인데도
  살아남은 흐름이 있어서다. 그러나 정책이 `JOERN-NO-BETTER`라 **판정에 관여하지 않고**
  `advisory_only: true`로만 실린다 — 최종 `detected`는 LLM이 낸 `false`다.
  이것이 V4 §4의 측정(판정 개입 시 precision 미달)을 코드로 반영한 결과다.
- **(b)에서 Joern은 `safe`**다. LLM이 탐지했고 Joern은 근거를 못 붙였다. 두 신호가 갈릴 때
  판정은 LLM을 따른다.
- 이 3건은 **데모이지 벤치가 아니다.** 성능 주장에 쓰지 않는다 —
  성능 수치는 FINAL_ARCHITECTURE_REPORT.md §3의 벤치 표를 본다.
