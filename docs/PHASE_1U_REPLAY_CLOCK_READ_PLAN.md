# Phase 1U: Offline Replay Clock + Read Plan

Phase 1U adds a strictly offline ReplayClock and ReplayReadPlan layer. It answers which local fake-data records would be read and in what deterministic replay order.

This phase does not execute replay logic, run strategies, score strategies, recommend trades, generate signals, generate risk decisions, create paper ledger entries, create paper exits, calculate bankroll metrics, connect to Kalshi, create credentials, poll APIs, open WebSockets, place orders, run live execution, build dashboard code, add machine learning code, integrate OpenClaw or MiroFish, or make runtime network calls.

## ReplayReadPlan

ReplayReadPlan is an inventory of artifact reads from the validated synthetic ReplayRunManifest.

Required fields:

- `replay_read_plan_id`
- `schema_version`
- `source_replay_run_manifest_id`
- `source_manifest_path`
- `generated_at`
- `paper_only`
- `live_execution_allowed`
- `order_placement_allowed`
- `replay_mode`
- `artifact_reads`
- `total_records_planned`
- `status`
- `reason`

Each artifact read includes:

- `read_index`
- `artifact_type`
- `artifact_path`
- `record_count`
- `validation_command`

## ReplayClock

ReplayClock is deterministic ordering metadata only. It reads local JSON and JSONL artifacts and emits clock events sorted by:

1. `record_time`
2. `artifact_type`
3. `record_id` when available, otherwise `record_ref`

Each clock event includes:

- `clock_index`
- `artifact_type`
- `artifact_path`
- `record_ref`
- `record_time`
- `record_id`

`record_time` uses `received_at` when present. For JSON summary-like records, it falls back to `generated_at`. If neither is present, it falls back to the manifest `generated_at`.

## Validation

The validators enforce:

- `paper_only` must be `true`.
- `live_execution_allowed` must be `false`.
- `order_placement_allowed` must be `false`.
- `replay_mode` must be `offline_fixture_replay`.
- ReplayClock status must be `replay_clock_ready` or `replay_clock_rejected`.
- ReplayReadPlan status must be `replay_read_plan_ready` or `replay_read_plan_rejected`.
- IDs must be deterministic.
- Paths must be relative repo paths.
- Paths must not escape the repo.
- Paths must not reference credentials, secrets, `.env` files, API keys, live configs, tokens, bearer material, or private keys.
- Clock ordering must be deterministic and contiguous.
- Read-plan indexes must be deterministic and contiguous.
- Planned record totals must match artifact read counts.

## Commands

```powershell
npm run validate:replay-clock
npm run validate:replay-read-plan
npm run test:replay-engine
```

## Boundary

ReplayClock and ReplayReadPlan are metadata-only. They describe local fixture read order but do not execute replay logic, run strategy code, create decisions, create trades, write ledger entries, write exits, calculate analytics, imply profit, or recommend actions.
