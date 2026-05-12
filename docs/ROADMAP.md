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
| 4N | Strategy Signal Definition | Translate the research hypothesis into a typed signal schema. What market, what edge condition, what threshold. | 🔁 ACTIVE |
| 4O | Signal Evaluation Pass | Run signal rules against historical/live fixture data. No picks emitted yet — output is hit-rate stats and calibration data. | ⬜ LATER |
| 4P | Paper Ledger | Track signal-triggered paper picks without real money. PnL, win rate, edge, calibration scores. | ⬜ LATER |

---

## Phase 5 — Research Review & Confidence Gates

Before any real position is considered, the research must clear explicit gates.

| Gate | Requirement |
|---|---|
| Signal calibration | Brier score and log score evaluated over ≥ N samples |
| Edge consistency | Positive net edge (fee-adjusted) across multiple market conditions |
| Paper PnL | Positive paper PnL over meaningful sample size |
| Risk governor review | Maximum position size, stop rules, and kill switch defined |
| Operator sign-off | Manual review of evidence bundle before live mode is enabled |

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
