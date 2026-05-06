# Phase 1W: Offline No-Op Replay Execution Shell

Phase 1W adds a strictly offline no-op replay shell that walks the validated ReplayClock and ReplayReadPlan and emits ReplayTrace metadata only.

This phase answers: what local fake-data records would Overlord read, and in what deterministic order?

It does not run strategies, generate EdgeSignals, generate RiskDecisions, generate ActionDecisions, generate PaperLedger entries, generate PaperExits, calculate strategy analytics, calculate bankroll metrics, recommend trades, place orders, connect to Kalshi, create credentials, poll APIs, open WebSockets, run live execution, build dashboard code, add machine learning code, integrate OpenClaw or MiroFish, or make runtime network calls.

## ReplayTrace

ReplayTrace records are JSONL metadata emitted by the no-op replay shell.

Required fields:

- `replay_trace_id`
- `schema_version`
- `generated_at`
- `paper_only`
- `live_execution_allowed`
- `order_placement_allowed`
- `replay_mode`
- `trace_event_type`
- `trace_index`
- `source_replay_run_manifest_id`
- `source_replay_clock_id`
- `source_replay_read_plan_id`
- `source_manifest_path`
- `artifact_type`
- `artifact_path`
- `record_ref`
- `record_time`
- `record_id`
- `status`
- `reason`

Allowed `trace_event_type` values:

- `noop_replay_started`
- `noop_record_read`
- `noop_replay_completed`
- `noop_replay_rejected`

Allowed `status` values:

- `trace_recorded`
- `trace_rejected`

## ReplayNoOpRunSummary

ReplayNoOpRunSummary is a single JSON summary of the no-op trace.

Required fields:

- `replay_noop_run_summary_id`
- `schema_version`
- `generated_at`
- `paper_only`
- `live_execution_allowed`
- `order_placement_allowed`
- `replay_mode`
- `source_replay_run_manifest_id`
- `source_replay_clock_id`
- `source_replay_read_plan_id`
- `total_trace_records`
- `total_records_read`
- `total_artifacts_read`
- `status`
- `reason`

Allowed status values:

- `noop_replay_summary_ready`
- `noop_replay_summary_rejected`

## Guarantees

- Inputs are the validated synthetic ReplayRunManifest, ReplayClock, and ReplayReadPlan.
- The shell verifies each clock event maps to a planned artifact read.
- The shell verifies each clock `record_ref` exists in the local fixture artifacts.
- Trace IDs are deterministic.
- Trace indexes are sequential and unique.
- The shell reads local fixture files only.
- The shell does not mutate source fixtures.
- The shell does not create decisions, trades, ledger entries, exits, analytics, or recommendations.

## Commands

```powershell
npm run validate:replay-trace
npm run validate:replay-noop-run-summary
npm run test:replay-engine
```

## Boundary

This is a no-op replay playlist walk only. It proves read order and source evidence availability, not strategy quality, edge, risk approval, paper execution, real execution, profit, settlement, or bankroll allocation.
