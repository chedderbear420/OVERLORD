# packages/replay-engine

Strictly offline replay manifest package for deterministic fake-data artifact inventories.

Phase 1S defines a ReplayRunManifest that references local validated fixture artifacts across the Overlord pipeline. It does not execute replay logic, run strategies, score strategies, recommend actions, write paper ledgers, write paper exits, connect to external systems, or perform bankroll/model analytics.

## Files

- `schemas/replay_run_manifest.schema.json`: ReplayRunManifest schema.
- `fixtures/synthetic_replay_run_manifest.json`: deterministic synthetic manifest.
- `src/build-replay-run-manifest.js`: read-only manifest builder.
- `src/replay-run-manifest-id.js`: deterministic manifest id helper.
- `src/validate-replay-run-manifest.js`: local manifest validator.
- `fixtures/negative/`: deterministic negative validation fixtures.

## Commands

```powershell
npm run validate:replay-run-manifest
npm run test:replay-engine
```

## Boundary

ReplayRunManifest is inventory and traceability only. It answers which local fake-data artifacts belong to a replay/accounting run.

## Validation

The manifest validator rejects malformed JSON, bad deterministic ids, unsafe paper/live/order flags, unknown artifact contracts, repo-escaping paths, credential or token paths, missing artifact files, duplicate artifact references, bad local record counts, unsafe validation commands, and forbidden strategy, bankroll, model-score, allocation, or recommendation fields.

Validation commands must remain local `npm run` scripts. Manifest validation must not execute replay logic, run strategies, connect to external systems, write ledger entries, write paper exits, calculate bankroll metrics, or recommend actions.
