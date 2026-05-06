# Phase 1S: Offline Replay Run Manifest

Phase 1S creates a strictly offline ReplayRunManifest layer. It records which local validated fake-data artifacts belong to a replay/accounting run.

This phase answers:

What exact local fake-data artifacts were used in this replay/accounting run?

It does not answer whether a strategy is good, whether Overlord should trade, how much bankroll should be allocated, whether live execution should occur, or what a model should do next.

## Scope

- Define the ReplayRunManifest schema.
- Build a deterministic manifest from local fixture references.
- Validate local artifact paths and safety flags.
- Validate referenced fixture files exist locally.
- Keep paths relative to the repo root.
- Keep generation read-only.

## Referenced Artifacts

- `packages/event-store/fixtures/synthetic_market_events.jsonl`
- `packages/market-state-engine/fixtures/synthetic_market_states.jsonl`
- `packages/edge-scanner/fixtures/synthetic_edge_signals.jsonl`
- `packages/risk-governor/fixtures/synthetic_risk_decisions.jsonl`
- `packages/risk-governor/fixtures/synthetic_action_decisions.jsonl`
- `packages/paper-trader/fixtures/synthetic_paper_ledger_entries.jsonl`
- `packages/paper-trader/fixtures/synthetic_paper_exits.jsonl`
- `packages/paper-trader/fixtures/synthetic_paper_performance_summary.json`

## Manifest Contract

Manifest records include:

- `replay_run_manifest_id`
- `schema_version`
- `generated_at`
- `paper_only`
- `live_execution_allowed`
- `order_placement_allowed`
- `replay_mode`
- `artifacts`
- `validation_commands`
- `status`
- `reason`

Artifact references include:

- `artifact_type`
- `artifact_path`
- `schema_version`
- `record_count`
- `validation_command`

## Validation Rules

- `schema_version` must be `replay_run_manifest.v1`.
- `replay_run_manifest_id` must be deterministic from `generated_at` and artifact paths.
- `paper_only` must be `true`.
- `live_execution_allowed` must be `false`.
- `order_placement_allowed` must be `false`.
- `replay_mode` must be `offline_fixture_replay`.
- `status` must be `manifest_ready` or `manifest_rejected`.
- Artifact paths must be relative to the repo root.
- Artifact paths must not escape the repo.
- Artifact paths must not reference credentials, env files, secrets, live configs, or API keys.
- Referenced files must exist locally.
- Manifest generation must not write ledger entries, exits, trades, or strategy outputs.

## Boundary

ReplayRunManifest is an inventory/traceability layer only. It does not execute replay logic, run strategies, score strategies, recommend actions, connect to external systems, implement model evaluation, implement real settlement, or perform bankroll management.
