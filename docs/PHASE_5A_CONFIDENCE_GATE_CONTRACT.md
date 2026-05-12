# Phase 5A — Confidence Gate Contract

## Status

**ACTIVE** (branch: `phase-5a-confidence-gate-contract`)

---

## Critical Safety Statement

**Phase 5A defines gates only.**

- This contract does **not** pass any gates.
- It only defines what evidence will be required in the future.
- It does **not** enable live mode.
- It does **not** add credentials.
- It does **not** add order placement.
- It does **not** implement Phase 6.
- All advanced/live permissions remain **false**.
- Phase 5B is the recommended next phase.

---

## Purpose

Phase 5A introduces the `KalshiConfidenceGateContract` artifact. It defines the static, blocked-by-default gate structure that must be satisfied before any future restricted live mode can even be considered.

This is a **non-actionable, paper-only, offline-safe** artifact. It performs no I/O, accesses no credentials, places no orders, emits nothing downstream, and passes no gates.

---

## Contract shape

```
KalshiConfidenceGateContract
├── kalshi_confidence_gate_contract_id     kcgc_-prefixed deterministic ID
├── schema_version                         "kalshi_confidence_gate_contract.v1"
├── generated_at                           ISO 8601 timestamp
├── gate_contract_mode                     "phase_5a_gate_contract_only"
├── source_phase                           "Phase 5A" (hardcoded)
├── required_source_artifacts              lineage object (4 artifact types)
│   ├── market_snapshot                    { schema_version, required: true }
│   ├── strategy_signal_definition         { schema_version, required: true }
│   ├── signal_evaluation_summary          { schema_version, required: true }
│   └── paper_ledger_entry                 { schema_version, required: true }
├── gates                                  array of 5 gate objects
│   ├── signal_calibration
│   ├── edge_consistency
│   ├── paper_pnl
│   ├── risk_governor
│   └── operator_signoff
├── overall_gate_status                    "blocked" (hardcoded)
├── phase_6_ready                          false (hardcoded)
├── live_mode_allowed                      false (hardcoded)
├── credentials_allowed                    false (hardcoded)
├── order_placement_allowed                false (hardcoded)
├── autonomous_execution_allowed           false (hardcoded)
├── risk_governor_required                 true (hardcoded)
├── operator_signoff_required              true (hardcoded)
├── operator_signoff_complete              false (hardcoded)
├── paper_only                             true (hardcoded)
├── reason_code                            "CONFIDENCE_GATES_DEFINED_BLOCKED"
└── reason                                 "confidence gate contract defined; advanced mode remains blocked"
```

---

## Deterministic ID

`kcgc_` + first 32 hex chars of SHA-256 of pipe-joined inputs:

```
gate_contract_mode | schema_version | source_phase | overall_gate_status | required_gate_count
```

---

## Required Gates

### Gate 1 — Signal Calibration Gate
- `gate_id`: `signal_calibration`
- `gate_status`: `requires_evidence`
- `current_evidence_status`: `not_evaluated`
- Evidence needed: minimum_sample_size, brier_score_required, log_score_required, calibration_curve_required

### Gate 2 — Edge Consistency Gate
- `gate_id`: `edge_consistency`
- `gate_status`: `requires_evidence`
- `current_evidence_status`: `not_evaluated`
- Evidence needed: fee_adjusted_positive_research_result_required, multiple_market_conditions_required, spread_liquidity_review_required

### Gate 3 — Paper PnL Gate
- `gate_id`: `paper_pnl`
- `gate_status`: `requires_evidence`
- `current_evidence_status`: `not_evaluated`
- Evidence needed: paper_ledger_sample_size_required, paper_net_result_review_required, drawdown_review_required

### Gate 4 — Risk Governor Gate
- `gate_id`: `risk_governor`
- `gate_status`: `blocked`
- `current_evidence_status`: `not_implemented`
- Evidence needed: max_position_cap_required, kill_switch_required, loss_limit_required, manual_review_required

### Gate 5 — Operator Sign-off Gate
- `gate_id`: `operator_signoff`
- `gate_status`: `blocked`
- `current_evidence_status`: `not_completed`
- Evidence needed: operator_review_required, manual_approval_required, audit_bundle_required

---

## Approved gate_status values (Phase 5A)

| Status | Meaning |
|---|---|
| `blocked` | Not yet implementable |
| `requires_evidence` | Defined; evidence collection not yet started |
| `not_evaluated` | Evidence not yet assessed |

**Forbidden gate_status values:** `passed`, `approved`, `ready`, `live_ready`, `complete` — the validator rejects any of these.

---

## Files

| File | Description |
|---|---|
| `packages/strategy-dsl/src/kalshi-confidence-gate-contract-id.js` | Deterministic ID (`kcgc_`) |
| `packages/strategy-dsl/src/build-kalshi-confidence-gate-contract.js` | Builder function |
| `packages/strategy-dsl/src/validate-kalshi-confidence-gate-contract.js` | Validator + CLI |
| `packages/strategy-dsl/schemas/kalshi_confidence_gate_contract.schema.json` | JSON Schema (draft 2020-12) |
| `packages/strategy-dsl/fixtures/synthetic_kalshi_confidence_gate_contract.json` | Committed synthetic fixture |
| `packages/strategy-dsl/tests/build-kalshi-confidence-gate-contract.test.js` | 11 builder tests |
| `packages/strategy-dsl/tests/kalshi-confidence-gate-contract-validation.test.js` | 30 validation tests |

---

## Commands

```bash
npm run validate:kalshi-confidence-gate-contract     # validate synthetic fixture
npm run test:strategy-dsl                            # run all strategy-dsl tests
```

---

## Safety invariants

- No Kalshi API, credentials, tokens, or env loading
- No live order placement or execution logic
- No polling, WebSockets, cron, or background workers
- All live/execution/order/credential flags hardcoded `false`
- `paper_only: true`, `operator_signoff_complete: false`, `phase_6_ready: false` are hardcoded constants
- `risk_governor_required: true`, `operator_signoff_required: true` are hardcoded constants
- `overall_gate_status: "blocked"` is hardcoded — the validator rejects any other value
- No gate status of `passed`, `approved`, `ready`, `live_ready`, or `complete` is permitted
- Validator enforces forbidden field names and forbidden string values recursively
- All five required gate IDs must be present exactly once

---

## Phase lineage

```
Phase 4M  KalshiMarketSnapshot
Phase 4N  KalshiStrategySignalDefinition
Phase 4O  KalshiSignalEvaluationSummary          ──┐
Phase 4P  KalshiPaperLedgerEntry                 ──┘→ Phase 5A KalshiConfidenceGateContract
```

---

## Next phase

**Phase 5B — Research Review Evidence Bundle**

Phase 5A is the first Phase 5 sub-phase. It defines gates only and does not evaluate any evidence.

---

## Approved Phase 5 breakdown

| Phase | Title | Status |
|---|---|---|
| 5A | Confidence Gate Contract | active |
| 5B | Research Review Evidence Bundle | later |
| 5C | Gate Evaluation Summary | later |
| 5D | Operator Sign-off Contract | later |
| 5E | Phase 6 Readiness Lock | later |
