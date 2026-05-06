# Phase 1O: Paper Exit and Simulated P/L Accounting

Phase 1O creates strictly offline fake exits for the fake wallet. It consumes valid paper-only ledger entries, applies local synthetic exit prices, records PaperExit JSONL records, and calculates deterministic simulated P/L.

This phase does not place orders, connect to Kalshi, create credentials, poll APIs, open WebSockets, run live execution, add dashboard code, add machine learning code, integrate OpenClaw or MiroFish, implement real settlement, or manage a real bankroll.

## Purpose

This phase answers:

Did Overlord record a simulated paper exit and calculate fake P/L correctly?

It does not imply real profit, real execution, real settlement, or real account balance changes.

## Inputs

- `packages/paper-trader/fixtures/synthetic_paper_ledger_entries.jsonl`
- `packages/paper-trader/fixtures/synthetic_exit_prices.jsonl`

## PaperExit Contract

PaperExit records include:

- `paper_exit_id`
- `schema_version`
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
- `paper_only`
- `live_execution_allowed`
- `order_placement_allowed`
- `exit_event_type`
- `side`
- `paper_entry_price`
- `paper_exit_price`
- `paper_quantity`
- `entry_notional_cents`
- `exit_notional_cents`
- `gross_pnl_cents`
- `estimated_fee_cents`
- `net_pnl_cents`
- `status`
- `reason`

## P/L Math

All values use integer cents.

- `entry_notional_cents = paper_entry_price * paper_quantity`
- `exit_notional_cents = paper_exit_price * paper_quantity`
- `gross_pnl_cents = exit_notional_cents - entry_notional_cents`
- `estimated_fee_cents = 0`
- `net_pnl_cents = gross_pnl_cents - estimated_fee_cents`

The fee field is a deterministic placeholder. Real exchange fees, settlement, final P/L, bankroll management, and strategy analytics remain out of scope.

## Validation Rules

- `schema_version` must be `paper_exit.v1`.
- `paper_exit_id` must be deterministic from `source_paper_ledger_entry_id` and `received_at`.
- `paper_only` must be `true`.
- `live_execution_allowed` must be `false`.
- `order_placement_allowed` must be `false`.
- `exit_event_type` must be `paper_exit_recorded` or `paper_exit_rejected`.
- `status` must be `paper_closed` or `paper_exit_rejected`.
- Recorded exits must have `paper_closed` status.
- Rejected exits must have `paper_exit_rejected` status.
- `side` must be `YES` or `NO`.
- Prices must be integer cents from 0 to 100.
- `paper_quantity` must be a positive integer for closed exits.
- Notional and P/L math must be internally consistent.
- Exit records must be monotonic by `received_at`.

## Append-Only Files

Paper exit files are plain JSONL. The writer appends only validated PaperExit records and rejects invalid batches before writing.
