# Vulnerability report and CPG graphs

The report keeps four sections: type description, source location, possible attack scenario, and remediation. The location section contains an expandable Cytoscape.js graph, with a force-directed network layout, directed edges, pan/zoom controls, edge-type filters, and selectable scan-time code excerpts.

## Version 2: actual Joern subgraph

`taint_spec.sc` exports each finding's actual CPG neighborhood. It seeds traversal with the original data-flow nodes and the containing sink call (when the rule targets an argument), then visits at most two hops through `AST`, `CFG`, and `REACHING_DEF` edges. IDs, directions, and types come from Joern; no links are inferred from code strings or LLM explanations. The original detection paths, rules, and verdicts are unchanged. A graph-export failure does not remove the security finding.

The graph is an induced, bounded neighborhood, **not the entire repository CPG** or a claim that every displayed node is tainted. At most 64 nodes and 256 edges are serialized, with `truncated` recording a cap. Nodes without a usable source location are omitted. `onPath` marks finding seeds; surrounding nodes are separately selectable. Call-site findings have no invented input source.

The UI initially shows the surrounding neighborhood with all edge types. Circular nodes use short code labels; full code remains in the selected-node panel. “Include surrounding code” can be disabled to focus on finding seeds. Filters distinguish data dependencies (`REACHING_DEF`), execution order (`CFG`), and parent-to-child code structure (`AST`). These edge types are not interchangeable. Isolated surrounding nodes are hidden in a filtered view; finding seeds remain visible even if a filter contains no connecting edge. The node dropdown provides a keyboard alternative to canvas clicks.

## AI finding context

After Java semantic analysis, one bounded context export per 128 targets imports the submitted Java repository and finds call nodes at each reported location. Blank/comment locations use a nearby call within five lines (next call preferred); `requestedLine` and `anchorLine` remain distinct and the UI discloses the offset. If no matching call exists or export fails, the finding remains without a fabricated graph. Context nodes all have `intermediate` roles, with `origin=joern` and `evidence=code-context`. Detection verdicts and reported line numbers are unchanged. This view is code context, not proof that the AI finding is exploitable.

## Storage and compatibility

- `ScanopsModelClient.EngineFinding` preserves the per-finding `cpg_graph` through ensemble expansion. AI findings retain their `qwen-*` source; a separate Joern context request attaches actual graph nodes and edges without claiming a proven taint path.
- `GithubPipelineRunner` validates and stores the graph using the existing nullable `cpg_graph TEXT` column. No new database migration is needed.
- The backend attaches source excerpts from submitted scan files (up to five lines before/after). It rejects invalid IDs, endpoints, edge types, and bounds; it never repairs malformed graphs with guessed edges.
- Version 1 ordered paths remain supported and are displayed with their existing partial/call-site distinctions. Old scans require a **new scan** to obtain version 2 topology.
- Owner authorization for scan/report endpoints remains unchanged. The graph library is loaded only when the panel is opened, from the application's bundled assets.

## Validation and preview

```sh
# scanops-frontend
node --test tests/vulnerability-guidance.test.mjs
npm run build
# scanops-backend, Java 17
./gradlew test bootJar
# scanops-model, local Joern installed
SCANOPS_TEST_JOERN=1 python3 -m unittest discover -s tests -p test_cpg_graph_export.py -v
```

The development-only `/preview/report` uses a saved **real local Joern 4.0.570 output** for the sample Java source in `cpg-sample.json` (13 nodes, 42 edges). This is a local analysis fixture, not a production scan. `graph=callsite`, `graph=partial`, and `graph=missing` retain synthetic compatibility fixtures. All preview code/data is excluded from the production bundle.

## Deployment

Version 2 requires updating the Joern query in the analysis worker and deploying the backend and frontend together. Verify the deployed Joern version by executing the integration sample in that runtime before rollout. Back up the previous query and backend artifact/container configuration; verify a new Java scan and authenticated graph retrieval after deployment. Keep existing Flyway migrations unchanged; never repair checksum mismatches to force rollout. Existing stored version 1 records are not rewritten.
