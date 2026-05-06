# Phase 2C: Offline StrategyRunTrace No-Op Shell

Phase 2C adds a strictly offline no-op strategy trace shell. It reads validated StrategyDefinition, StrategyRunIntent, ReplayEvidenceBundle, ReplayRunReport, and ReplayTrace fixtures, then emits metadata describing where a strategy would observe replay inputs.

This phase does not execute strategy logic, calculate edge, generate signals, generate decisions, create paper ledger entries, create paper exits, calculate analytics, recommend trades, connect to Kalshi, or place orders.

## Records

### StrategyRunTrace

StrategyRunTrace records are JSONL metadata. They include:

- deterministic `strategy_run_trace_id`
- `schema_version`
- `generated_at`
- `paper_only: true`
- `live_execution_allowed: false`
- `order_placement_allowed: false`
- StrategyDefinition and StrategyRunIntent ids
- replay provenance ids
- replay mode and run mode
- no-op trace event type
- deterministic trace index
- observed artifact type/path/ref/time/id
- status and reason

Allowed trace event types:

- `noop_strategy_run_started`
- `noop_strategy_input_observed`
- `noop_strategy_run_completed`
- `noop_strategy_run_rejected`

Allowed statuses:

- `strategy_trace_recorded`
- `strategy_trace_rejected`

### StrategyNoOpRunSummary

StrategyNoOpRunSummary is a JSON metadata record summarizing the no-op strategy trace count and observed input count. It is fake run metadata only, not analytics.

Allowed statuses:

- `strategy_noop_summary_ready`
- `strategy_noop_summary_rejected`

## Deterministic Behavior

The no-op shell observes ReplayTrace `noop_record_read` records in line order and emits one `noop_strategy_input_observed` record for each. Boundary records are emitted before and after observation. Trace ids are deterministic from StrategyRunIntent id, trace index, event type, and record reference.

## Validation Rules

- Trace indexes must be unique and sequential.
- StrategyRunTrace ids must be deterministic.
- StrategyNoOpRunSummary ids must be deterministic.
- All safety flags must remain paper-only and non-live.
- Artifact paths must be relative repo paths.
- Artifact paths must not escape the repo.
- Artifact paths must not reference credentials, env files, secrets, API keys, tokens, or live configs.
- Forbidden executable/runtime/live/network/order/trade/signal/decision/credential/bankroll/recommendation/analytics fields are rejected anywhere in trace or summary records.

## Commands

```powershell
npm run validate:strategy-run-trace
npm run validate:strategy-noop-run-summary
npm run test:strategy-dsl
```

## Boundary

This phase traces where a strategy would observe local replay inputs only. It does not run strategy code and does not create trading decisions.
