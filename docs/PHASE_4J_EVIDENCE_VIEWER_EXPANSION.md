# Phase 4J: Evidence Viewer Expansion

## Goal

Extend the static offline operator dashboard with a 5-step evidence chain viewer linking all Phase 4B–4H artifacts into one read-only review flow, plus a safety guarantee block that surfaces all locked/safe flags in a scannable badge grid. No fetch calls, no external deps, no live paths.

## Deliverables

### Dashboard Update

`apps/dashboard/index.html`

Added:
- **Evidence Chain panel** (`id="evidence-chain"`): 5-step vertical stepper, each step showing fixture filename, artifact ID, status chips, and key metadata
  - Step 1 — Processing Contract: `sopc_d5f85d3ac42b6ade0754837ea0354a77`, VALIDATION_PASSED
  - Step 2 — Processing Input Set: `sopis_e375ea353c05147738b963a553f0e776`, 7 artifacts, all read_only
  - Step 3 — Processing Trace: 9 records JSONL, `noop_processing_completed`, `sha256:46ebe409…`
  - Step 4 — Processing Noop Summary: `sopns_eb0a5457434b46ab04693890fa87ba42`, `processing_noop_summary_ready`, `sha256:bcfb57e7…`
  - Step 5 — Artifact Manifest: `sopam_f925d406b96cad22874fe8dbf9f1541a`, `artifact_manifest_ready`, 7 inputs + 2 outputs hashed
- **Safety Guarantee Block** (`id="safety-guarantee-block"`): 8 `locked` badges (No Live API, No Credentials, No Orders, No Bankroll Actions, No Network Calls, No Signals, No Recommendations, No Decisions) + 6 `safe` badges (`paper_only: true`, `live_execution_allowed: false`, `order_placement_allowed: false`, `credentials_allowed: false`, `network_allowed: false`, `replay_mode: offline_fixture_replay`)
- Updated phase badge (`PHASE 4J :: EVIDENCE VIEWER EXPANSION ACTIVE`), status cards (4I complete, 4J active), roadmap (4I complete, 4J active, 4K later), footer (Phase 4J, 4B–4I enforced)
- Added drift guard to validation command panel
- Added `.ec-chain`, `.ec-step`, `.ec-spine`, `.ec-node.sealed`, `.ec-line`, `.ec-body`, `.ec-label`, `.ec-fixture`, `.ec-id`, `.ec-status-line`, `.ec-chip`, `.ec-desc`, `.ec-meta`, `.safety-block`, `.safety-badges`, `.safety-badge.locked`, `.safety-badge.safe`, `.safety-footer-note` CSS classes; no JS added

### Safety Test Update

`apps/dashboard/test-dashboard-safety.js`

Added 9 new required-presence assertions (up from 16 → 25 total REQUIRED_FLAGS, 39 total checks):
- `evidence-chain` panel id present
- `safety-guarantee-block` panel id present
- `sopc_d5f85d3ac42b6ade0754837ea0354a77` contract ID displayed
- `sopis_e375ea353c05147738b963a553f0e776` input set ID displayed
- `Processing Contract` step label displayed
- `Processing Input Set` step label displayed
- `Processing Trace` step label displayed
- `Processing Noop Summary` step label displayed
- `Artifact Manifest` step label displayed

Result: **39 passed, 0 failed** (up from 30).

### Phase Doc

`docs/PHASE_4J_EVIDENCE_VIEWER_EXPANSION.md` — this file.

## What this phase does not include

- No fetch, WebSocket, XHR, external scripts, or external stylesheets
- No localStorage, sessionStorage, timers, or workers
- No trading controls, signals, decisions, or recommendations
- No changes to strategy-dsl validators, builders, fixtures, or schemas

## Phase prerequisites confirmed

| Check | Result |
|---|---|
| Phase 4I processing pipeline panel present | yes |
| Phase 4K drift guard present and passing (19/19) | yes |
| `npm run test:dashboard` — 39 passed, 0 failed | yes |
| `npm run test:dashboard-drift` — 19 passed, 0 failed | yes |
| `npm run test:strategy-dsl` — 153 passed, 0 failed | yes |

## Completion rule

Phase 4J is complete when:

1. `node apps/dashboard/test-dashboard-safety.js` → 39 passed, 0 failed
2. `node apps/dashboard/test-dashboard-fixture-drift.js` → 19 passed, 0 failed
3. `npm run test:strategy-dsl` → 153 tests, all pass (no regressions)
4. Evidence chain panel visible in browser with correct 5-step artifact chain
5. Safety guarantee block visible with all locked/safe badges
6. No forbidden code pattern introduced

## Recommended next phase

**Phase 4L: TBD**

Options: Kalshi adapter contract definition (read-only, no network calls); market data fixture schema; or evidence bundle diff viewer. Maintains offline-safe posture.
