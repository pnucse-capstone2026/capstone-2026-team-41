# 데모 응답 3건 — 실행 조건과 해석

**실행 2026-08-17, 온프레미스 스택(`docker compose -p scanops-onprem-demo --profile llm`).**
응답 JSON은 **고치지 않은 원본**이다.

## ⚠️ 이 데모의 LLM은 프로덕션 모델이 아니다

| | 프로덕션(SaaS) | **이 데모** |
|---|---|---|
| 모델 | `scanops-rebuild-9b-q4km.gguf` (Qwen3.5-9B **QLoRA 파인튜닝**) | **베이스 `Qwen3.5-9B-Q4_K_M`** (어댑터 없음) |
| 이유 | RunPod 볼륨에 있음 | **v1 어댑터 GGUF가 로컬에 없다**(로컬 GGUF는 7B LoRA뿐) |

## 결과: 3건 모두 `detected: false`

(a) 명백한 SQLi, (b) 명백한 command injection 인데도 미탐이다.
**원인을 직접 확인했다** — llama-server 원문 출력:

```
'<think>\nThinking Process:\n\n1.  **Analyze the Request:** ...
```

베이스 모델은 `<think>` 블록부터 낸다. `_detect`는 `n_predict=200`으로 호출하므로
**사고에 예산이 다 쓰여 4줄 서식(`VULNERABILITY: …`)에 도달하지 못한다** →
파싱 결과가 비어 `NONE` → `detected: false`.

파인튜닝 어댑터는 바로 그 4줄 서식을 내도록 학습된 모델이다.
따라서 **이 미탐은 파이프라인 결함이 아니라 "다른 모델을 끼웠다"의 결과**다.
다만 그것을 **측정으로 확인했을 뿐, 어댑터를 끼웠을 때의 데모는 오늘 확보하지 못했다**(§9).

## `joern_evidence`가 비어 있는 이유

세 응답 모두 `{"joern_verdict": "unknown", "advisory_only": true}` 다.
데모 실행 시점의 compose는 `tmpfs: /tmp`를 **noexec**로 마운트하고 있었고,
Joern이 zstd 네이티브 바이너리를 실행하지 못해 CPG 생성이 전부 실패했다
(워커 로그: `"the configured temp directory (/tmp) is mounted with noexec flag"`).

**compose는 고쳤다**(`/tmp:size=4g,exec`). 그러나 지시서 규칙대로
**데모 응답은 다시 찍지 않고 그대로 둔다** — 이 파일은 실행 당시 상태의 증거다.

## 확인된 계약 필드

미탐이더라도 **응답 구조 자체는 계약대로** 나왔다:
`detected / vulnerability / severity / cvss_score / source / status / evidence /
joern_evidence(advisory_only) / elapsed`.
`source="llm"`, `status="DONE"`, `joern_evidence.advisory_only=true`(판정 미개입)가
설계와 일치한다.

## noexec 수정 후 Joern 재검증 (데모 응답과 별개)

compose를 `/tmp:size=4g,exec`로 고친 뒤 워커를 재기동해 **같은 SQLi 스니펫**을 직접 넣었다:

```
verdict: vuln | unknown_reason: None | categories: ['sqli']
findings: 1
   source       L1   String n
   intermediate L1   "SELECT * FROM t WHERE n='" + n + "'"
   intermediate L1   s
   sink         L1   executeQuery("SELECT * FROM t WHERE n='" + n + "'")
```

즉 **수정 후에는 Joern이 정상 동작하고 path도 채워진다.**
위의 데모 응답 3건은 수정 **전** 실행분이며, 규칙대로 다시 찍지 않았다.
