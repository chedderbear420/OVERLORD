# Phase 1N: PaperLedger Validation Hardening

Phase 1N hardens PaperLedgerEntry validation before paper exits, settlement, or P/L accounting can consume ledger records. This is a validation-only phase. It does not place orders, connect to Kalshi, create credentials, poll APIs, open WebSockets, run live execution, add dashboard code, add machine learning code, or integrate OpenClaw or MiroFish.

## Scope

The phase adds deterministic negative fixtures for malformed, unsafe, inconsistent, duplicate, and mathematically invalid paper ledger records.

## Validation Requirements

- Positive `synthetic_paper_ledger_entries.jsonl` must pass.
- Malformed JSONL must fail cleanly.
- Required provenance fields must be present:
  - `source_action_decision_id`
  - `source_risk_decision_id`
  - `source_signal_id`
  - `source_state_id`
  - `source_event_id`
  - `source_payload_hash`
  - `market_id`
  - `captured_at`
  - `received_at`
- `paper_ledger_entry_id` must be deterministic from `source_action_decision_id`.
- Duplicate ledger ids are rejected.
- Fixture ordering must be monotonic by `received_at`.
- `paper_only` must be `true`.
- `live_execution_allowed` must be `false`.
- `order_placement_allowed` must be `false`.
- `ledger_event_type` must be `paper_entry_recorded` or `paper_entry_rejected`.
- `status` must be `paper_open` or `paper_rejected`.
- `paper_entry_price` must be integer cents from 1 to 99.
- `paper_quantity` must be a positive integer for `paper_open` entries.
- `notional_cents` must equal `paper_entry_price * paper_quantity`.
- `notional_cents` must not exceed `max_paper_exposure_cents`.
- `final_pnl_cents` must remain `null` until exits and settlement exist.

## Boundary

PaperLedgerEntry records remain simulated only. The ledger does not implement exits, settlement, final P/L, bankroll management, live execution, real order ids, or real account identifiers.

After this phase, PaperLedger entry validation should freeze unless a bug appears.
