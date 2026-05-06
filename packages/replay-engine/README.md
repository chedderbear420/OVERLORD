# packages/replay-engine

Strictly offline replay manifest package for deterministic fake-data artifact inventories.

Phase 1S defines a ReplayRunManifest that references local validated fixture artifacts across the Overlord pipeline. It does not execute replay logic, run strategies, score strategies, recommend actions, write paper ledgers, write paper exits, connect to external systems, or perform bankroll/model analytics.

## Files

- `schemas/replay_run_manifest.schema.json`: ReplayRunManifest schema.
- `schemas/replay_clock.schema.json`: ReplayClock schema.
- `schemas/replay_read_plan.schema.json`: ReplayReadPlan schema.
- `fixtures/synthetic_replay_run_manifest.json`: deterministic synthetic manifest.
- `fixtures/synthetic_replay_clock.json`: deterministic replay clock generated from local fixtures.
- `fixtures/synthetic_replay_read_plan.json`: deterministic read plan generated from the manifest.
- `src/build-replay-run-manifest.js`: read-only manifest builder.
- `src/build-replay-clock.js`: read-only replay clock builder.
- `src/build-replay-read-plan.js`: read-only replay read-plan builder.
- `src/replay-run-manifest-id.js`: deterministic manifest id helper.
- `src/replay-clock-id.js`: deterministic replay clock id helper.
- `src/replay-read-plan-id.js`: deterministic replay read-plan id helper.
- `src/replay-artifact-reader.js`: local JSON/JSONL artifact reader.
- `src/validate-replay-run-manifest.js`: local manifest validator.
- `src/validate-replay-clock.js`: local ReplayClock validator.
- `src/validate-replay-read-plan.js`: local ReplayReadPlan validator.
- `fixtures/negative/`: deterministic negative validation fixtures.

## Commands

```powershell
npm run validate:replay-run-manifest
npm run validate:replay-clock
npm run validate:replay-read-plan
npm run test:replay-engine
```

## Boundary

ReplayRunManifest is inventory and traceability only. It answers which local fake-data artifacts belong to a replay/accounting run.

ReplayClock and ReplayReadPlan are also metadata-only. They describe which local fixture records would be read and in what deterministic order. They do not execute replay logic, run strategies, generate EdgeSignals, create RiskDecisions, write paper ledger entries, write paper exits, calculate analytics, or recommend actions.

## Validation

The manifest validator rejects malformed JSON, bad deterministic ids, unsafe paper/live/order flags, unknown artifact contracts, repo-escaping paths, credential or token paths, missing artifact files, duplicate artifact references, bad local record counts, unsafe validation commands, and forbidden strategy, bankroll, model-score, allocation, or recommendation fields.

Validation commands must remain local `npm run` scripts. Manifest validation must not execute replay logic, run strategies, connect to external systems, write ledger entries, write paper exits, calculate bankroll metrics, or recommend actions.
