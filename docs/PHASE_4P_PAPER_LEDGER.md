# Phase 4P — Paper Ledger Entry Contract

## Status

**ACTIVE** (branch: `phase-4p-paper-ledger-entry`, PR #15 open)

Phase 4P is the final planned Phase 4 sub-phase. Next: Phase 5 — Research Review & Confidence Gates.

## Purpose

Phase 4P introduces the `KalshiPaperLedgerEntry` artifact. It records the hypothetical economics of a Phase 4N signal observation — one contract unit, unsettled fixture — using the Phase 4O `KalshiSignalEvaluationSummary` and Phase 4M `KalshiMarketSnapshot` as inputs.

This is a **non-actionable, paper-only, offline-safe** artifact. It performs no I/O, accesses no credentials, places no orders, and emits nothing downstream.

---

## Contract shape

```
KalshiPaperLedgerEntry
├── kalshi_paper_ledger_entry_id                 kple_-prefixed deterministic ID
├── schema_version                               "kalshi_paper_ledger_entry.v1"
├── generated_at                                 ISO 8601 timestamp
├── ledger_mode                                  "local_fixture_paper_only"
├── source_phase                                 "Phase 4P" (hardcoded)
├── signal_evaluation_summary_id                 kses_-prefixed ID (Phase 4O input)
├── signal_evaluation_summary_schema_version
├── market_snapshot_id                           kms_-prefixed ID (Phase 4M input)
├── market_snapshot_schema_version
├── input_artifact_refs                          cross-referenced lineage objects
│   ├── signal_evaluation_summary                { artifact_id, schema_version }
│   └── market_snapshot                          { artifact_id, schema_version }
├── paper_accounting_mode                        "one_contract_unit_observation"
├── paper_entry_status                           "recorded_paper_observation"
├── paper_outcome_status                         "open_unsettled"
├── market_ticker                                from market snapshot
├── event_ticker                                 from market snapshot
├── condition_family                             from signal evaluation summary
├── paper_contract_side                          "yes_contract"
├── paper_units                                  1
├── paper_entry_price_cents                      last_price_cents from snapshot
├── paper_mark_price_cents                       last_price_cents from snapshot (default)
├── paper_unrealized_pnl_cents                   mark − entry
├── paper_realized_pnl_cents                     null (unsettled_fixture)
├── paper_fees_cents                             0 (default)
├── paper_net_pnl_cents                          unrealized − fees
├── paper_settlement_status                      "unsettled_fixture"
├── research_notes                               structured observation object
│   ├── source_evaluation_status                 "evaluated_non_actionable"
│   ├── ledger_entry_scope                       "paper_only_observation"
│   └── runtime_reference                        "none"
├── paper_only                                   true  (hardcoded)
├── live_execution_allowed                       false (hardcoded)
├── order_placement_allowed                      false (hardcoded)
├── credentials_used                             false (hardcoded)
├── network_request_used                         false (hardcoded)
├── emits_signal_events                          false (hardcoded)
├── emits_recommendations                        false (hardcoded)
├── emits_decisions                              false (hardcoded)
├── emits_orders                                 false (hardcoded)
├── emits_live_positions                         false (hardcoded)
├── emits_paper_ledger_entries                   false (hardcoded)
├── reason_code                                  "PAPER_LEDGER_ENTRY_RECORDED"
└── reason                                       "paper ledger entry recorded from local fixture"
```

---

## Deterministic ID

`kple_` + first 32 hex chars of SHA-256 of pipe-joined inputs:

```
signalEvaluationSummaryId | marketSnapshotId | ledgerMode | schemaVersion | paperAccountingMode | paperContractSide
```

---

## PnL semantics

- `paper_entry_price_cents` — `last_price_cents` from the Phase 4M market snapshot at observation time.
- `paper_mark_price_cents` — same as entry in Phase 4P (no mark-to-market movement yet; overridable via `opts.paperMarkPriceCents` for testing).
- `paper_unrealized_pnl_cents` — `mark − entry` for `yes_contract`. Negative when mark falls below entry.
- `paper_realized_pnl_cents` — always `null` in Phase 4P (unsettled_fixture).
- `paper_fees_cents` — always `0` in Phase 4P (no fee model yet).
- `paper_net_pnl_cents` — **`unrealized − fees`** (fees are subtracted — a positive fee reduces net PnL).

---

## Files

| File | Description |
|---|---|
| `packages/strategy-dsl/src/kalshi-paper-ledger-entry-id.js` | Deterministic ID (`kple_`) |
| `packages/strategy-dsl/src/build-kalshi-paper-ledger-entry.js` | Builder function |
| `packages/strategy-dsl/src/validate-kalshi-paper-ledger-entry.js` | Validator + CLI |
| `packages/strategy-dsl/schemas/kalshi_paper_ledger_entry.schema.json` | JSON Schema (draft 2020-12) |
| `packages/strategy-dsl/fixtures/synthetic_kalshi_paper_ledger_entry.json` | Committed synthetic fixture |
| `packages/strategy-dsl/tests/build-kalshi-paper-ledger-entry.test.js` | 14 builder tests |
| `packages/strategy-dsl/tests/kalshi-paper-ledger-entry-validation.test.js` | 48 validation tests |

---

## Commands

```bash
npm run validate:kalshi-paper-ledger-entry     # validate synthetic fixture
npm run test:strategy-dsl                      # run all strategy-dsl tests
```

---

## Safety invariants

- No Kalshi API, credentials, tokens, or env loading
- No live order placement or execution logic
- No polling, WebSockets, cron, or background workers
- `paper_only: true`, `live_execution_allowed: false`, `order_placement_allowed: false` are hardcoded constants; the validator rejects any deviation
- All emit flags are hardcoded `false`; Phase 4P records but emits nothing
- `paper_realized_pnl_cents` is always `null` (unsettled_fixture); validator enforces this
- `paper_net_pnl_cents` validated: must equal `paper_unrealized_pnl_cents − paper_fees_cents`
- `paper_units` must be exactly `1`
- `paper_settlement_status` must be `"unsettled_fixture"`
- `paper_entry_status` must be `"recorded_paper_observation"`
- `paper_outcome_status` must be `"open_unsettled"`
- `condition_family` must be `"descriptive_market_movement"`

---

## Phase lineage

```
Phase 4M  KalshiMarketSnapshot          ──┐
Phase 4N  KalshiStrategySignalDef       ──┤→ Phase 4O KalshiSignalEvaluationSummary ──┐
                                                                                        │→ Phase 4P KalshiPaperLedgerEntry
Phase 4M  KalshiMarketSnapshot          ───────────────────────────────────────────────┘
```

---

## research_notes object shape

```json
{
  "source_evaluation_status": "evaluated_non_actionable",
  "ledger_entry_scope": "paper_only_observation",
  "runtime_reference": "none"
}
```

All three keys are const-constrained. `additionalProperties: false`. The validator rejects strings, missing keys, wrong values, and unknown keys.

---

## Next phase

**Phase 5 — Research Review & Confidence Gates**

Phase 4P is the final planned Phase 4 sub-phase.
