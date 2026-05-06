# Phase 1V: ReplayClock and ReplayReadPlan Validation Hardening

Phase 1V hardens ReplayClock and ReplayReadPlan validation before any future replay execution shell can consume replay metadata.

This is a validation-only phase. ReplayClock remains ordering metadata only. ReplayReadPlan remains read-plan metadata only. This phase does not execute replay logic, run strategies, score strategies, recommend trades, generate signals, generate risk decisions, create paper ledger entries, create paper exits, calculate bankroll metrics, connect to Kalshi, create credentials, poll APIs, open WebSockets, place orders, run live execution, build dashboard code, add machine learning code, integrate OpenClaw or MiroFish, or make runtime network calls.

## ReplayClock Hardening

ReplayClock validation rejects:

- Malformed JSON.
- Missing provenance fields.
- Bad deterministic `replay_clock_id`.
- `paper_only: false`.
- `live_execution_allowed: true`.
- `order_placement_allowed: true`.
- Invalid `replay_mode`.
- Invalid status.
- Empty or missing `clock_events`.
- Non-contiguous or duplicate `clock_index` values.
- Invalid `record_time` values.
- Non-deterministic clock ordering.
- Unsafe artifact paths, including repo escapes and credentials/secrets/API-key/live-config paths.
- Forbidden execution, strategy, bankroll, model, recommendation, order, and trade request fields anywhere in the record.

## ReplayReadPlan Hardening

ReplayReadPlan validation rejects:

- Malformed JSON.
- Missing provenance fields.
- Bad deterministic `replay_read_plan_id`.
- `paper_only: false`.
- `live_execution_allowed: true`.
- `order_placement_allowed: true`.
- Invalid `replay_mode`.
- Invalid status.
- Empty or missing `artifact_reads`.
- Non-contiguous or duplicate `read_index` values.
- Invalid record counts.
- `total_records_planned` values that do not equal artifact read counts.
- Unsafe artifact paths, including repo escapes and credentials/secrets/API-key/live-config paths.
- Non-local validation commands.
- Forbidden execution, strategy, bankroll, model, recommendation, order, and trade request fields anywhere in the record.

## Negative Fixtures

Negative fixtures live under `packages/replay-engine/fixtures/negative/` and cover malformed JSON, bad IDs, missing provenance, unsafe flags, invalid modes/statuses, missing arrays, duplicate indexes, bad ordering, bad timestamps, unsafe paths, bad totals, and forbidden execution-like or strategy-like fields.

## Commands

```powershell
npm run validate:replay-clock
npm run validate:replay-read-plan
npm run test:replay-engine
```

## Boundary

After Phase 1V, ReplayClock and ReplayReadPlan validation should freeze unless a bug appears. Future replay work must continue to treat these records as metadata inputs, not execution plans, strategy reports, bankroll reports, trade requests, or recommendations.
