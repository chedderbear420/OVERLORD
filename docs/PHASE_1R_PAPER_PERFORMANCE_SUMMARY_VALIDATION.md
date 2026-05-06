# Phase 1R: PaperPerformanceSummary Validation Hardening

Phase 1R hardens PaperPerformanceSummary validation before analytics, bankroll, model evaluation, or recommendation layers can consume fake-accounting summaries.

This is a validation-only phase. PaperPerformanceSummary remains fake-accounting only. It is not strategy analytics, bankroll management, settlement, model evaluation, live trading, or a recommendation engine.

## Scope

This phase adds deterministic negative fixtures for malformed, unsafe, inconsistent, or strategy-like summary records.

## Validation Requirements

- Positive `synthetic_paper_performance_summary.json` must pass.
- Malformed summary JSON must fail cleanly.
- Required provenance fields must be present:
  - `source_ledger_fixture`
  - `source_exit_fixture`
  - `ledger_record_count`
  - `exit_record_count`
  - `generated_at`
  - `schema_version`
- `paper_performance_summary_id` must be deterministic from source fixtures and `generated_at`.
- `paper_only` must be `true`.
- `live_execution_allowed` must be `false`.
- `order_placement_allowed` must be `false`.
- `summary_type` must be `paper_accounting_summary`.
- `status` must be `summary_ready` or `summary_rejected`.
- Count fields must be non-negative integers.
- `open_paper_entries` must equal `total_paper_entries - closed_paper_entries`.
- `closed_paper_entries` must not exceed `total_paper_entries`.
- Entry counts must not exceed `ledger_record_count`.
- Exit counts must not exceed `exit_record_count`.
- Accounting totals must be integer cents.
- `total_net_pnl_cents` must equal `total_gross_pnl_cents - total_estimated_fees_cents`.
- Win/loss/flat exit counts must sum to `total_paper_exits`.
- Strategy, bankroll, model score, allocation, and recommendation fields are forbidden.

## Forbidden Fields

- `roi`
- `roi_percent`
- `sharpe_ratio`
- `bankroll_growth`
- `kelly_fraction`
- `strategy_score`
- `model_score`
- `recommendation`
- `recommended_action`
- `allocation_cents`
- `live_trade_recommendation`

## Boundary

Phase 1R does not connect to Kalshi, create credentials, poll APIs, open WebSockets, place orders, run live execution, add dashboard code, add machine learning code, integrate OpenClaw or MiroFish, implement real settlement, implement bankroll management, implement strategy analytics, implement model evaluation, implement automated recommendations, or make runtime network calls.

After this phase, PaperPerformanceSummary validation should freeze unless a bug appears.
