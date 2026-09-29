> **보존된 2026-09-08 기록입니다. 현재 실행은 [Java 실행 안내](docs/JAVA_DEPLOYMENT.md)를 사용하세요.**
> 이 문서의 main 미반영 및 과거 기능 설명은 당시 상태입니다.

# 2026-09-08 verified trial deployment update — takes precedence over historical instructions below

Status: analysis EC2 deployment, backend Java-only routing, and a two-file live-site Java
integration scan have completed. The tested production artifacts are still based on mixed
local worktrees, so the baseline commits alone do not reproduce the deployment.
The original runbook below is historical and MUST NOT be followed without this update.

- User selected `cpg-qwen38-ensemble`. `shadow` was explicitly approved in this deployment task;
  Compose requires an explicit `GRAPH_SPEC_DYNAMIC_RULE_MODE` value. Critic, dynamic
  sanitizers and dynamic propagation stay off. Context engine is not selected.
- Existing `SCANOPS_MODEL_URL` and `SCANOPS_API_KEY` remain the legacy route. Configure
  only `SCANOPS_JAVA_MODEL_URL=http://172.31.21.183:8100` and `SCANOPS_JAVA_API_KEY`
  on the backend at the approved switch. The latter must match model `SCANOPS_API_KEY`.
  Missing Java URL preserves the old route; missing Java key with a Java URL fails.
- Java-only API is enabled. Remote bind `JAVA_ENGINE_BIND_IP` must be explicit and private;
  no loopback default or Joern port publication. Actual security groups still need read-only
  verification and user approval before changes; previous public rules were deferred.
- Joern container: 5 GiB, JVM 3 GiB, RSS guard 4608 MiB, stage timeout 600s.
  API container: 1536 MiB, exactly one uvicorn worker and one analysis request at a time.
  Excess requests receive 429. Limits: 50 files, 200000 chars/file, 500000 chars/request;
  exceeding these returns 413 without truncation. These are preparation limits, not capacity proof.
- Joern HTTP client timeout 630s, Qwen per-call timeout 120s. Backend single Java request
  timeout 900s, batch/PR per partition 30min. A total analysis deadline/cancellation and
  site proxy limits remain unverified; a client timeout does not necessarily cancel work.
- Model API batch/PR errors now fail rather than silently skipping files. Java incomplete
  responses are rejected by backend. Multiple findings and original lines are carried through.
  The live-site test stored and displayed one CWE-79 finding at its original line with source,
  attack scenario, and remediation. Multiple-finding UI behavior remains contract-tested only.
- Base images are pinned. Python package versions are still resolved at build time;
  preserve the tested image IDs for transfer or lock dependencies before a later rebuild.
- Existing server files must be backed up and checksummed before any replacement.
  Server has no Git history; do not assume git pull is available.
- The bounded deployment calls approved for this session are complete. Do not make additional
  paid Qwen calls without a new approval. The old live smoke runner enables rulegen/enforce and
  is NOT an approved deployment test.
- Rollback the backend with `scanops-backend:rollback-20260908T071915Z` and the original base
  Compose plus `.env.aws`. Do not change legacy RunPod/ZAP/RDS. See the handoff for exact commands.

Current evidence and detailed status: `../HANDOFF_JAVA_DEPLOYMENT.md` and
`../deployment-evidence/20260908/`. Everything below is retained as historical context.

---

# Java CPG + Qwen: EC2 integration and deployment

## Status and scope

This runbook deploys the existing Java CPG analysis API with Qwen rule proposals and
Qwen-generated explanations. The F1 0.901 target-CWE-aware routing experiment is NOT
implemented by this deployment. A blind semantic detector and aggregation layer still
require implementation and evaluation. Shadow uses fixed rules for verdicts; enforce
temporarily adds eligible generated rules and is not rule promotion.

The six-rule structural candidate pack failed real-CVE validation (0/8 projects,
TP/FP/FN 0/2/34). No external LLM ran in that validation. This is evidence of failed
generalization of that candidate, not a measured result for a blind Qwen ensemble.

## 1. Record the existing deployment

On the backend EC2, record its running image digest, Compose project name, Compose
file path, model URL, and how secrets are injected. Keep the previous model image and
RunPod endpoint available for rollback. Do not print secrets with `docker inspect` or
`docker compose config`; use `docker compose config --quiet` for validation.

Inspect free RAM and disk with `free -h` and `df -h`. Joern needs substantial RAM;
this template allows 8 GiB for its container and 4 GiB JVM heap. Allocate additional
RAM for Linux and FastAPI. Do not put this workload on an already-full backend/ZAP host.
Use an x86-64 analysis EC2 in the backend VPC, or a separate host with private connectivity.
Actual memory and latency requirements must be measured on the demo repository.

## 2. Prepare the reviewed source

Place scanops-model and scanops-infra beside one another on the analysis host.
Transfer only the reviewed source and dependencies, not the entire local workspace:
the workspace contains model weights, benchmark datasets and secret files.
The local code changes have not been published; cloning main alone does not include them.
Build the updated Spring backend separately with the same deployment process it currently uses.

## 3. Inject analysis secrets

Create a server-only `.env.java` through the existing secret management mechanism:

```dotenv
SCANOPS_API_KEY=<same key configured in Spring backend>
DASHSCOPE_API_KEY=<DashScope key>
DASHSCOPE_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
JAVA_ENGINE_BIND_IP=<analysis EC2 private interface IP>
GRAPH_SPEC_DYNAMIC_RULE_MODE=shadow
```

The default bind address is loopback. A remote backend requires the private interface
address and a security-group inbound TCP 8100 rule whose source is the backend security
group. Port 8200 stays inside Docker; do not publish it. Outbound HTTPS is needed for
DashScope. Secrets are not frontend build variables.

## 4. Build and start only the analysis services

From scanops-infra:

```sh
docker compose -p scanops-java -f docker-compose.java-engine.yml --env-file .env.java config --quiet
docker compose -p scanops-java -f docker-compose.java-engine.yml --env-file .env.java build
docker compose -p scanops-java -f docker-compose.java-engine.yml --env-file .env.java up -d
docker compose -p scanops-java -f docker-compose.java-engine.yml --env-file .env.java ps
```

Use reviewed/pinned image digests for the final release: the current Joern Dockerfile
uses the mutable master base tag. Record the built digests and the Joern version used.

## 5. Check the API before connecting the site

From the backend host call `http://<analysis-private-IP>:8100/health`. This checks the
API process; it does not prove Joern can import a repository. Then POST `/analyze/batch`
with the shared `X-API-Key` header and a small Java-only fixture:

```json
{"files":[{"language":"Java","file_path":"Demo.java","code":"class Demo {}","use_rag":false}],"stop_on_first":false}
```

Require DONE, a nonempty results array, and matching filenames. Run a reviewed
vulnerable fixture and its safe counterpart; confirm actual sink lines and explanations.
With a missing worker the scan must fail/be partial, never be presented as clean.
Use a server-side client that reads the key from its environment rather than putting
the secret literal into shell history.

## 6. Connect the updated Spring backend

Set `SCANOPS_MODEL_URL=http://<analysis-private-IP>:8100` and the matching
`SCANOPS_API_KEY` in the EXISTING backend deployment. Rebuild/recreate only its backend
service using its existing Compose project and env file; keep DB/ZAP configuration.
The updated model client sends X-API-Key, reads status/source/line/evidence/ai_prompt,
and rejects PARTIAL batch results so the existing billing-failure path releases the hold.
The GitHub webhook model call also sends X-API-Key.

## 7. Verify in the site

Log in and submit an authorized Java-only demonstration repository. Check
RUNNING -> COMPLETED, vulnerable and safe cases, source file and real sink line,
attack scenario and remediation text. The stored solution includes the repair prompt.
The report UI also builds its own copyable prompt from stored cause/solution; it does
not currently read a dedicated model ai_prompt database column.

Current gaps before a general release: multiple findings in a single file are collapsed
by the existing API; the collector skips files longer than 8,000 characters and limits
file count by plan; severity for CPG findings is UNKNOWN; non-Java requests still use
legacy code; the blind semantic ensemble is not implemented. Resolve and test these
before advertising full-repository, multi-finding, QLoRA-free service coverage.

## 8. Enforce and rollback

For a controlled demonstration of Qwen-generated source/sink rules set
GRAPH_SPEC_DYNAMIC_RULE_MODE=enforce and recreate model-api with the same project/file.
Keep sanitizer, propagation and critic off for the initial comparison. Record the
configuration with results. Enforce may increase false positives; schema acceptance
is not proof that the proposed API role is semantically correct.

If the new endpoint fails, restore the previous SCANOPS_MODEL_URL/image and recreate
only the backend service. Preserve the old RunPod worker until rollback is no longer
needed and no other language uses it. Do not delete model volumes or database volumes.

## RunPod alternative

Joern is a JVM/CPU workload and Qwen is hosted by DashScope. A GPU QLoRA container
cannot be converted merely by changing MODEL_PATH. A RunPod Pod may host the new
Joern image, but its HTTP proxy is public: the current Joern HTTP handler has no API-key
authentication. Add authenticated ingress or a private tunnel before using it remotely.
The private EC2 analysis-host arrangement above avoids exposing that handler.

References:
- https://docs.aws.amazon.com/vpc/latest/userguide/security-group-rules.html
- https://docs.runpod.io/pods/configuration/expose-ports
