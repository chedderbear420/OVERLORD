# Phase 1Y: Offline Replay Evidence Bundle and Run Report

Phase 1Y adds a strictly offline evidence bundle and run report for the no-op replay shell.

This phase is proof and inventory metadata only. It does not execute replay strategy logic, generate EdgeSignals, generate RiskDecisions, create paper ledger entries, create paper exits, calculate strategy analytics, calculate bankroll metrics, recommend trades, connect to Kalshi, create credentials, or perform network calls.

## Scope

- Define ReplayEvidenceBundle and ReplayRunReport schemas.
- Build deterministic synthetic fixtures from existing replay artifacts.
- Validate local artifact paths and safety flags.
- Validate source IDs and no-op replay totals are internally consistent.
- Keep everything local, read-only, no-op, and dependency-free.

## ReplayEvidenceBundle

The bundle ties together:

- ReplayRunManifest
- ReplayClock
- ReplayReadPlan
- ReplayTrace
- ReplayNoOpRunSummary

It preserves:

- `source_replay_run_manifest_id`
- `source_replay_clock_id`
- `source_replay_read_plan_id`
- `source_replay_noop_run_summary_id`
- source artifact paths for manifest, clock, read plan, trace, and summary

It also records evidence artifact metadata and deterministic consistency checks.

## ReplayRunReport

The report summarizes the evidence bundle without adding strategy interpretation:

- total artifacts verified
- total trace records
- total records read
- total artifacts read
- consistency status

The report does not include ROI, strategy score, bankroll allocation, model ranking, recommendation, order request, trade request, or execution plan fields.

## Consistency Checks

Phase 1Y checks:

- manifest ID matches ReplayClock provenance
- manifest ID matches ReplayReadPlan provenance
- manifest ID matches ReplayTrace provenance
- manifest ID matches ReplayNoOpRunSummary provenance
- clock ID matches ReplayTrace provenance
- read plan ID matches ReplayTrace provenance
- summary ID links to the same clock and read plan
- trace record count matches summary totals
- no-op record-read count matches summary totals
- artifact-read total matches ReplayReadPlan shape
- evidence artifact count matches the local replay evidence contract

## Validation Rules

- `paper_only` must be `true`.
- `live_execution_allowed` must be `false`.
- `order_placement_allowed` must be `false`.
- `replay_mode` must be `offline_fixture_replay`.
- Artifact paths must be relative repo paths.
- Credential, secret, `.env`, API-key, token, and live-config paths are rejected.
- Validation commands must be local `npm run` scripts.
- Forbidden execution, strategy, bankroll, model, recommendation, order, and trade fields are rejected.

## Boundary

ReplayEvidenceBundle and ReplayRunReport are no-op replay evidence only. They prove what local fake-data artifacts were used and whether the no-op replay metadata agrees with itself. They do not score a strategy, recommend a trade, create a decision, create a paper ledger entry, create an exit, or imply real profit.
