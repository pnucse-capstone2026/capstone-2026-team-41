# Vulnerability report and CPG paths

The report keeps four sections: type description, source location, possible attack scenario, and remediation. The location section includes an expandable CPG flow view. It displays the ordered path returned by Joern for the individual finding, not the full AST/CFG/CPG and not an LLM-generated diagram.

## Data contract

- `GithubPipelineRunner` saves the scan-time source excerpt and `CpgGraph` JSON on the vulnerability.
- Only individual findings whose source is exactly `cpg` are eligible. Semantic-only or ambiguous mixed evidence is not displayed as CPG.
- JSON version 1 contains `kind`, ordered `nodes`, and sequential `edges`. Nodes preserve file, line, role, analyzer code, and an optional scan-time excerpt (five lines on either side).
- `data-flow` requires source and sink endpoints. Sink-only findings are `call-site`. Truncated or incomplete paths are `partial-flow`; the UI explicitly distinguishes them.
- Invalid paths are rejected, not repaired by inventing nodes or edges. Missing source text falls back to the analyzer's recorded code without fabricated line numbering.
- Scan and report vulnerability endpoints require the owner JWT. Public source fallback for old findings is restricted to GitHub raw URLs and never forwards the ScanOps token.

## Schema and rollout

Flyway V11 adds source excerpt columns. V12 adds nullable `cpg_graph TEXT`. Existing records remain valid and require a new scan to acquire CPG paths; no retrospective path is guessed from stored descriptions.

Before AWS deployment, compare all already-applied migration resources with the currently deployed JAR. A previous deployment encountered a legacy V3 checksum discrepancy. Do not use Flyway repair or alter existing migrations to force rollout. Back up the running artifact/container configuration, deploy the tested JAR, then verify health, migration success, authenticated report access, and a new Java scan.

No model service change is required for this version. It uses existing per-finding `path` evidence. Long paths truncated by the current analyzer are shown as partial paths.

## Validation

```sh
# scanops-frontend
node --test tests/vulnerability-guidance.test.mjs
npm run build
# scanops-backend (Java 17)
./gradlew test bootJar
```

Local development only: `/preview/report` uses explicitly labeled synthetic data. Query `graph=callsite`, `graph=partial`, or `graph=missing` exercises alternative states. Preview routes and fixtures are excluded from the production bundle.
