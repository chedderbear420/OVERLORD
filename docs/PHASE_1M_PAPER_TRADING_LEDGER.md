# Phase 1M: Paper Trading Ledger Foundation

Phase 1M creates the strictly offline paper ledger foundation. It records simulated paper-only candidate entries from approved ActionDecision records and does not place orders, connect to Kalshi, create credentials, poll APIs, open WebSockets, run live execution, add dashboard code, add machine learning code, or integrate OpenClaw or MiroFish.

## Purpose

The paper ledger answers one question:

Did Overlord record a paper-only candidate entry in a replayable ledger?

It does not answer whether a real trade happened, whether an order should be submitted, whether an exit should occur, or what final P/L is.

## Inputs

- `packages/risk-governor/fixtures/synthetic_action_decisions.jsonl`
- `packages/risk-governor/fixtures/synthetic_risk_decisions.jsonl`

ActionDecision records provide permission and safety flags. RiskDecision records provide the descriptive market side, observed price, and risk provenance needed to construct a paper entry.

## Ledger Contract

PaperLedgerEntry records are immutable JSONL records with:

- `paper_ledger_entry_id`
- `schema_version`
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
- `ledger_event_type`
- `side`
- `paper_entry_price`
- `max_paper_exposure_cents`
- `paper_quantity`
- `notional_cents`
- `status`
- `reason`
- `final_pnl_cents`

`final_pnl_cents` is intentionally `null` in this phase because exits, settlement, and P/L attribution are not implemented yet.

## Validation Rules

- `schema_version` must be `paper_ledger_entry.v1`.
- `paper_ledger_entry_id` must be deterministic from `source_action_decision_id`.
- `paper_only` must be `true`.
- `live_execution_allowed` must be `false`.
- `order_placement_allowed` must be `false`.
- `ledger_event_type` must be `paper_entry_recorded` or `paper_entry_rejected`.
- `status` must be `paper_open` or `paper_rejected`.
- Recorded entries must have `status: paper_open`.
- Rejected entries must have `status: paper_rejected`.
- `side` must be `YES` or `NO`.
- `paper_entry_price` must be integer cents from 1 to 99.
- `max_paper_exposure_cents`, `paper_quantity`, and `notional_cents` must be non-negative integers.
- `notional_cents` must equal `paper_entry_price * paper_quantity`.
- `notional_cents` must not exceed `max_paper_exposure_cents`.
- `captured_at` and `received_at` must be valid timestamps.
- `received_at` must be equal to or after `captured_at`.
- Ledger fixture order must be monotonic by `received_at`.

## Append-Only Files

Paper ledger files are plain JSONL. The writer creates files with exclusive create semantics and appends validated entries only. Invalid entries are rejected before any write.

The reader returns ledger entries in JSONL line order and fails cleanly on malformed JSONL.

## Boundaries

This phase creates the fake wallet, not the real wallet. It records paper entries only. It does not implement exits, settlement, final P/L, bankroll management, live order fields, real account identifiers, or real order ids.
