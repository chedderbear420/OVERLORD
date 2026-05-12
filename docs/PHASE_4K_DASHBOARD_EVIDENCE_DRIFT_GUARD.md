# Phase 4K: Dashboard Evidence Fixture Drift Guard

## Goal

Add a live-fixture drift guard for the operator dashboard. The guard reads the 5 evidence chain fixture files, extracts canonical IDs, counts, status values, and SHA-256 hashes, then asserts they appear verbatim in `apps/dashboard/index.html`. It also live-computes SHA-256 of the two output artifact files and cross-checks them against both the artifact manifest and the dashboard display. Fails loudly if any fixture value has drifted from what the dashboard shows.

## Deliverables

### Drift Guard Script

`apps/dashboard/test-dashboard-fixture-drift.js`

19 assertions across 6 sections:

| Section | Checks |
|---|---|
| [1] Processing Contract | contract ID, reason_code |
| [2] Processing Input Set | input set ID, artifact count (7) |
| [3] Processing Trace | record count (9), started event, completed event |
| [4] Processing Noop Summary | noop summary ID, status, total_trace_records (9), total_inputs_observed (7) |
| [5] Artifact Manifest | manifest ID, reason_code, input count (7), output count (2) |
| [6] Live SHA-256 integrity | live trace hash vs manifest, live noop hash vs manifest, both prefixes in dashboard |

Result: **19 passed, 0 failed**

### npm Script

`package.json`

Added: `"test:dashboard-drift": "node apps/dashboard/test-dashboard-fixture-drift.js"`

### Phase Doc

`docs/PHASE_4K_DASHBOARD_EVIDENCE_DRIFT_GUARD.md` — this file.

## What this phase does not include

- No changes to `apps/dashboard/index.html`
- No changes to any fixture files or validators
- No fetch, WebSocket, XHR, external scripts, or timers
- No trading controls, signals, decisions, or recommendations

## Phase prerequisites confirmed

| Check | Result |
|---|---|
| All 5 evidence chain fixtures present and validated | yes |
| `npm run test:dashboard-drift` — 19 passed, 0 failed | yes |
| `npm run test:dashboard` — 30 passed, 0 failed | yes |
| `npm run test:strategy-dsl` — 153 passed, 0 failed | yes |

## Completion rule

Phase 4K is complete when:

1. `node apps/dashboard/test-dashboard-fixture-drift.js` → 19 passed, 0 failed
2. `npm run test:dashboard` → 30 passed, 0 failed (no regressions)
3. `npm run test:strategy-dsl` → 153 tests, all pass
4. No fixture file, dashboard HTML, or safety flag modified

## How the drift guard catches problems

If a fixture file is regenerated and its ID or hash changes:
- Section [1–5]: the new ID/value won't match the hardcoded dashboard display → FAIL
- Section [6]: `liveTraceHash !== manifestTraceHash` or hash prefix missing from dashboard → FAIL

The guard must be updated (or the dashboard updated) whenever fixtures are intentionally regenerated.

## Recommended next phase

**Phase 4L: TBD**

Options: extend drift guard to cover the full fixture artifact chain (all 26 fixture files); add a Kalshi adapter contract definition (read-only, no network calls); or build a market data fixture schema.
