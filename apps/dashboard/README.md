# apps/dashboard — Overlord Operator Dashboard (Phase 4C)

**Status:** Active — Phase 4C  
**Mode:** Offline · Read-only · Fixture-fed · No network · No execution

---

## What this is

A local static HTML dashboard that displays validated fixture metadata from
`packages/strategy-dsl/fixtures/`. It has no live data path, no credentials,
no API calls, no WebSockets, no polling, and no execution controls.

Open `index.html` directly in a browser. No build step, no npm install, no server.

```
start apps/dashboard/index.html       # Windows
open apps/dashboard/index.html        # macOS
```

Or from the repo root:

```
npm run dashboard
```

---

## What it displays

- Current repo phase (4B complete, 4C active)
- Adjusted roadmap (4C→4D→4E→5A)
- Safety flags (`paper_only`, `live_execution_allowed: false`, etc.)
- Fixture artifact viewer for 5 synthetic processing artifacts
- Artifact manifest with SHA-256 hashes for all 7 input artifacts
- Source provenance IDs from the artifact manifest
- Forbidden processing outputs from the contract
- Validation commands to run locally
- Case file summary counts

---

## What it does NOT contain

- No Kalshi connectivity
- No credentials, tokens, or API keys
- No `fetch()`, `XMLHttpRequest`, `WebSocket`, or `EventSource`
- No order buttons, buy/sell controls, or action recommendations
- No live market data
- No signal generation, edge, EV, or probability display
- No strategy execution or paper entry/exit logic

---

## Safety test

```
node apps/dashboard/test-dashboard-safety.js
```

Scans `index.html` for forbidden code patterns and verifies required safety
flags are displayed. Exits non-zero on any violation.

---

## Fixtures consumed (display only)

All from `packages/strategy-dsl/fixtures/`:

| File | Schema |
|------|--------|
| `synthetic_strategy_observation_processing_contract.json` | `strategy_observation_processing_contract.v1` |
| `synthetic_strategy_observation_processing_input_set.json` | `strategy_observation_processing_input_set.v1` |
| `synthetic_strategy_observation_processing_artifact_manifest.json` | `strategy_observation_processing_artifact_manifest.v1` |
| `synthetic_strategy_observation_evidence_bundle.json` | `strategy_observation_evidence_bundle.v1` |
| `synthetic_strategy_observation_case_file_summary.json` | `strategy_observation_case_file_summary.v1` |

Fixture data is embedded at build time. The dashboard performs no runtime reads.

---

## Phase context

- **Phase 4B** — Boundary lockdown complete. Strict validation, artifact manifest hashing,
  reason codes, path safety, and red-team fixtures.
- **Phase 4C** — This dashboard. Pulled forward ahead of the original processing trace shell
  to give a local view before adding more pipeline stages.
- **Phase 4D** — No-op observation processing trace shell (next).
- **Phase 4E** — Evidence viewer expansion (later).
- **5A** — Read-only Kalshi adapter contract (later, no live calls).
