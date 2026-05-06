# packages/replay-engine

Strictly offline replay manifest package for deterministic fake-data artifact inventories.

Phase 1S defines a ReplayRunManifest that references local validated fixture artifacts across the Overlord pipeline. It does not execute replay logic, run strategies, score strategies, recommend actions, write paper ledgers, write paper exits, connect to external systems, or perform bankroll/model analytics.

## Files

- `schemas/replay_run_manifest.schema.json`: ReplayRunManifest schema.
- `fixtures/synthetic_replay_run_manifest.json`: deterministic synthetic manifest.
- `src/build-replay-run-manifest.js`: read-only manifest builder.
- `src/replay-run-manifest-id.js`: deterministic manifest id helper.
- `src/validate-replay-run-manifest.js`: local manifest validator.

## Commands

```powershell
npm run validate:replay-run-manifest
npm run test:replay-engine
```

## Boundary

ReplayRunManifest is inventory and traceability only. It answers which local fake-data artifacts belong to a replay/accounting run.
