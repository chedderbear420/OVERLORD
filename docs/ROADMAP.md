# Overlord Roadmap

Kalshi sports prediction-market research OS. Paper-only. No live credentials or execution until research validates the signal and all safety gates pass.

---

## Status legend

| Badge | Meaning |
|---|---|
| ✅ COMPLETE | Merged to main, tests pass |
| 🔁 ACTIVE | Current branch open |
| 🔜 NEXT | Planned, scoped |
| ⬜ LATER | On the list, not yet scoped |

---

## Phase 4 — Observation Processing Pipeline (sub-phases)

This is the current development track. Phases 0–3 established the schema, replay engine, strategy DSL, and observation stack (see historical docs in `docs/`). Phase 4 builds the processing layer and operator dashboard on top.

| Phase | Title | Status |
|---|---|---|
| 4A | Strategy Observation Processing Contract | ✅ COMPLETE |
| 4B | Observation Boundary Schema Lockdown | ✅ COMPLETE |
| 4C | Offline Operator Dashboard | ✅ COMPLETE |
| 4D | Agent Operating Standard | ✅ COMPLETE |
| 4E | Agent Skill Entrypoint / Repo Bootstrap | ✅ COMPLETE |
| 4F | No-op Observation Processing Trace Shell | ✅ COMPLETE |
| 4G | Processing Noop Summary | ✅ COMPLETE |
| 4H | Artifact Manifest Update (SHA-256 output sealing) | ✅ COMPLETE |
| 4I | Dashboard Processing Pipeline Panel | ✅ COMPLETE |
| 4J | Dashboard Evidence Viewer Expansion | ✅ COMPLETE |
| 4K | Dashboard Fixture Drift Guard | ✅ COMPLETE |

---

## Phase 4 continued — Live Data Onramp

These phases wire in real Kalshi market data while keeping the paper-only, contract-first posture. No credentials touch the codebase until 4L defines the adapter contract.

| Phase | Title | Goal | Status |
|---|---|---|---|
| 4L | Kalshi Adapter Contract | Define permitted endpoints, response shapes, and forbidden actions. Schema + fixture only — no HTTP client yet. | ✅ COMPLETE |
| 4M | Market Data Ingest & Fixture Format | Live market snapshots → canonical fixture format. Read-only, no order endpoints. | ✅ COMPLETE |
| 4N | Strategy Signal Definition | Translate the research hypothesis into a typed signal schema. What market, what edge condition, what threshold. | ✅ COMPLETE |
| 4O | Signal Evaluation Pass | Run signal rules against historical/live fixture data. No picks emitted yet — output is hit-rate stats and calibration data. | ✅ COMPLETE |
| 4P | Paper Ledger Entry Contract | Record hypothetical economics for one contract unit from a signal evaluation. Non-actionable paper accounting — no execution, no emit. | ✅ COMPLETE |

---

## Phase 5 — Research Review & Confidence Gates

Before any real position is considered, the research must clear explicit confidence gates. Phase 5A defines those gates. No gates pass in Phase 5A. All advanced/live permissions remain blocked by default.

| Phase | Title | Status |
|---|---|---|
| 5A | Confidence Gate Contract | ✅ COMPLETE |
| 5B | Research Review Evidence Bundle | 🔁 ACTIVE |
| 5C | Gate Evaluation Summary | ⬜ LATER |
| 5D | Operator Sign-off Contract | ⬜ LATER |
| 5E | Phase 6 Readiness Lock | ⬜ LATER |

### Required confidence gates

| Gate | Requirement |
|---|---|
| Signal calibration | Brier score and log score evaluated over ≥ N samples |
| Edge consistency | Fee-adjusted positive research result across multiple market conditions |
| Paper PnL | Paper ledger evidence reviewed over meaningful sample size |
| Risk governor review | Maximum position cap, kill switch, and loss limit defined and implemented |
| Operator sign-off | Manual review of full evidence bundle before any advanced mode is enabled |

---

## Phase 6 — Restricted Live Mode (not yet scoped)

Only reachable after Phase 5 gates pass. Requires:

- Kalshi API credentials stored in env (never committed)
- Hard position size cap enforced by risk governor
- Kill switch that disables all order placement immediately
- Full audit trail from signal → decision → order → fill
- Manual-confirm on every order until confidence is proven

---

## What this platform will never do

- Auto-place orders without operator confirmation (until Phase 6+ and all gates pass)
- Store credentials in the repo
- Emit signals, recommendations, or picks before the research pipeline validates them
- Weaken any safety flag (`paper_only`, `live_execution_allowed`, `order_placement_allowed`)
