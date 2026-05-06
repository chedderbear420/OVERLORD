# Phase 1Q: Read-Only Paper Performance Summary

Phase 1Q adds a strictly offline read-only fake-accounting summary layer. It aggregates valid paper ledger entries and valid paper exit records into deterministic PaperPerformanceSummary records.

This phase answers:

What happened in the fake paper ledger?

It does not answer whether a strategy is good, whether Overlord should trade, how much bankroll should be allocated, or whether live execution should occur.

## Scope

- Read local synthetic PaperLedgerEntry records.
- Read local synthetic PaperExit records.
- Validate source records before summarizing.
- Build deterministic read-only summary records.
- Validate the summary fixture.
- Keep all math in integer cents.

## PaperPerformanceSummary Contract

Summary records include:

- `paper_performance_summary_id`
- `schema_version`
- `source_ledger_fixture`
- `source_exit_fixture`
- `ledger_record_count`
- `exit_record_count`
- `generated_at`
- `paper_only`
- `live_execution_allowed`
- `order_placement_allowed`
- `summary_type`
- `total_paper_entries`
- `total_paper_exits`
- `open_paper_entries`
- `closed_paper_entries`
- `rejected_paper_entries`
- `rejected_paper_exits`
- `total_entry_notional_cents`
- `total_exit_notional_cents`
- `total_gross_pnl_cents`
- `total_estimated_fees_cents`
- `total_net_pnl_cents`
- `winning_paper_exits`
- `losing_paper_exits`
- `flat_paper_exits`
- `status`
- `reason`

## Accounting Rules

- `total_paper_entries` counts ledger entries with `ledger_event_type: paper_entry_recorded`.
- `rejected_paper_entries` counts ledger entries with `ledger_event_type: paper_entry_rejected`.
- `total_paper_exits` counts exits with `exit_event_type: paper_exit_recorded`.
- `rejected_paper_exits` counts exits with `exit_event_type: paper_exit_rejected`.
- `closed_paper_entries` is derived from unique recorded exits.
- `open_paper_entries = total_paper_entries - closed_paper_entries`.
- `total_entry_notional_cents` sums paper ledger entry notional where applicable.
- `total_exit_notional_cents` sums paper exit notional where applicable.
- `total_gross_pnl_cents` sums fake gross P/L from paper exits.
- `total_estimated_fees_cents` sums fake estimated fees from paper exits.
- `total_net_pnl_cents` sums fake net P/L from paper exits.
- Winning, losing, and flat exit counts are based on fake `net_pnl_cents`.

## Boundaries

This is fake-accounting only. It does not connect to Kalshi, create credentials, poll APIs, open WebSockets, place orders, run live execution, add dashboard code, add machine learning code, integrate OpenClaw or MiroFish, implement real settlement, implement bankroll management, implement strategy analytics, implement model evaluation, or generate automated recommendations.
