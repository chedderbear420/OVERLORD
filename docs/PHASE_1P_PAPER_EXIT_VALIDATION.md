# Phase 1P: PaperExit Validation Hardening

Phase 1P hardens PaperExit validation before strategy analytics, bankroll logic, real settlement, or any future reporting layer can consume simulated paper exits.

This is a validation-only phase. PaperExit remains simulated only. A PaperExit is not a real trade, not an order, not settlement, and not a real profit record.

## Scope

This phase adds deterministic negative fixtures for malformed, inconsistent, unsafe, duplicated, non-monotonic, or mathematically invalid PaperExit records.

## Validation Requirements

- Positive `synthetic_paper_exits.jsonl` must pass.
- Malformed PaperExit JSONL must fail cleanly.
- Required provenance fields must be present:
  - `source_paper_ledger_entry_id`
  - `source_action_decision_id`
  - `source_risk_decision_id`
  - `source_signal_id`
  - `source_state_id`
  - `source_event_id`
  - `source_payload_hash`
  - `market_id`
  - `captured_at`
  - `received_at`
- `paper_exit_id` must be deterministic from `source_paper_ledger_entry_id` and `received_at`.
- `paper_only` must be `true`.
- `live_execution_allowed` must be `false`.
- `order_placement_allowed` must be `false`.
- `paper_entry_price` must be integer cents from 0 to 100.
- `paper_exit_price` must be integer cents from 0 to 100.
- `paper_quantity` must be a positive integer.
- `entry_notional_cents` must equal `paper_entry_price * paper_quantity`.
- `exit_notional_cents` must equal `paper_exit_price * paper_quantity`.
- `gross_pnl_cents` must equal `exit_notional_cents - entry_notional_cents`.
- `estimated_fee_cents` must be a non-negative integer.
- `net_pnl_cents` must equal `gross_pnl_cents - estimated_fee_cents`.
- Duplicate PaperExit ids are rejected.
- Fixture ordering must be monotonic by `received_at`.
- `exit_event_type` must be `paper_exit_recorded` or `paper_exit_rejected`.
- `status` must be `paper_closed` or `paper_exit_rejected`.
- `paper_exit_recorded` must map to `paper_closed`.
- `paper_exit_rejected` must map to `paper_exit_rejected`.

## Boundaries

Phase 1P does not connect to Kalshi, create credentials, poll APIs, open WebSockets, place orders, run live execution, add dashboard code, add machine learning code, integrate OpenClaw or MiroFish, implement real settlement, implement bankroll management, implement strategy analytics, or implement real execution.

After this phase, PaperExit validation should freeze unless a bug appears.
