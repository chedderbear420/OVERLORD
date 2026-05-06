# Phase 1T: ReplayRunManifest Validation Hardening

Phase 1T hardens the offline ReplayRunManifest inventory layer before any future replay execution layer can consume manifest records.

This is a validation-only phase. ReplayRunManifest remains a local fake-data artifact inventory. It does not execute replay logic, run strategies, score strategies, recommend trades, calculate bankroll metrics, connect to Kalshi, create credentials, poll APIs, open WebSockets, place orders, run live execution, build dashboard code, add machine learning code, integrate OpenClaw or MiroFish, or make runtime network calls.

## Validation Contract

The validator rejects manifest records that violate any of these rules:

- Required manifest fields must be present: `replay_run_manifest_id`, `schema_version`, `generated_at`, `paper_only`, `live_execution_allowed`, `order_placement_allowed`, `replay_mode`, `artifacts`, `validation_commands`, `status`, and `reason`.
- `schema_version` must be `replay_run_manifest.v1`.
- `replay_run_manifest_id` must be deterministic from `generated_at` and artifact paths.
- `paper_only` must be `true`.
- `live_execution_allowed` must be `false`.
- `order_placement_allowed` must be `false`.
- `replay_mode` must be `offline_fixture_replay`.
- `status` must be `manifest_ready` or `manifest_rejected`.
- Artifacts must use known deterministic artifact contracts.
- Artifact paths must be relative repo paths only.
- Artifact paths must not escape the repo.
- Artifact paths must not reference credentials, secrets, `.env` files, API keys, live configs, tokens, bearer material, or private keys.
- Referenced artifact files must exist locally.
- Duplicate artifact references are rejected.
- Artifact `record_count` must be a non-negative integer matching the local fixture: JSON files count as one record and JSONL files count non-empty lines.
- Validation commands must be local `npm run` scripts only.
- Validation commands must not contain network or shell escape patterns such as `curl`, `wget`, `fetch`, `http`, `https`, PowerShell network calls, pipes, or redirection.
- Manifest records must not contain strategy, bankroll, model-score, allocation, or recommendation fields.

## Negative Fixtures

Negative fixtures live under `packages/replay-engine/fixtures/negative/` and cover malformed JSON, bad manifest ids, missing provenance, unsafe paper/live/order flags, invalid modes/statuses, unsafe paths, credential paths, missing artifacts, duplicate artifacts, bad record counts, unsafe validation commands, and forbidden strategy/bankroll/recommendation fields.

## Commands

```powershell
npm run validate:replay-run-manifest
npm run test:replay-engine
```

## Boundary

Phase 1T freezes the ReplayRunManifest validation surface unless a bug appears. Future replay work must continue to treat the manifest as an inventory and traceability input, not as an execution plan, strategy report, bankroll report, or trade recommendation.
