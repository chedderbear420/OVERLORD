# packages/replay-engine

Strictly offline replay manifest package for deterministic fake-data artifact inventories.

Phase 1S defines a ReplayRunManifest that references local validated fixture artifacts across the Overlord pipeline. It does not execute replay logic, run strategies, score strategies, recommend actions, write paper ledgers, write paper exits, connect to external systems, or perform bankroll/model analytics.

## Files

- `schemas/replay_run_manifest.schema.json`: ReplayRunManifest schema.
- `schemas/replay_clock.schema.json`: ReplayClock schema.
- `schemas/replay_read_plan.schema.json`: ReplayReadPlan schema.
- `schemas/replay_trace.schema.json`: ReplayTrace schema.
- `schemas/replay_noop_run_summary.schema.json`: ReplayNoOpRunSummary schema.
- `schemas/replay_evidence_bundle.schema.json`: ReplayEvidenceBundle schema.
- `schemas/replay_run_report.schema.json`: ReplayRunReport schema.
- `fixtures/synthetic_replay_run_manifest.json`: deterministic synthetic manifest.
- `fixtures/synthetic_replay_clock.json`: deterministic replay clock generated from local fixtures.
- `fixtures/synthetic_replay_read_plan.json`: deterministic read plan generated from the manifest.
- `fixtures/synthetic_replay_trace.jsonl`: deterministic no-op trace fixture.
- `fixtures/synthetic_replay_noop_run_summary.json`: deterministic no-op summary fixture.
- `fixtures/synthetic_replay_evidence_bundle.json`: deterministic evidence bundle fixture.
- `fixtures/synthetic_replay_run_report.json`: deterministic no-op run report fixture.
- `src/build-replay-run-manifest.js`: read-only manifest builder.
- `src/build-replay-clock.js`: read-only replay clock builder.
- `src/build-replay-read-plan.js`: read-only replay read-plan builder.
- `src/build-replay-trace.js`: deterministic no-op trace and summary builder.
- `src/build-replay-evidence-bundle.js`: deterministic evidence bundle builder.
- `src/build-replay-run-report.js`: deterministic no-op run report builder.
- `src/run-noop-replay.js`: validates and walks local replay metadata without executing strategies.
- `src/replay-run-manifest-id.js`: deterministic manifest id helper.
- `src/replay-clock-id.js`: deterministic replay clock id helper.
- `src/replay-read-plan-id.js`: deterministic replay read-plan id helper.
- `src/replay-trace-id.js`: deterministic ReplayTrace id helper.
- `src/replay-noop-run-summary-id.js`: deterministic ReplayNoOpRunSummary id helper.
- `src/replay-evidence-bundle-id.js`: deterministic ReplayEvidenceBundle id helper.
- `src/replay-run-report-id.js`: deterministic ReplayRunReport id helper.
- `src/replay-artifact-reader.js`: local JSON/JSONL artifact reader.
- `src/validate-replay-run-manifest.js`: local manifest validator.
- `src/validate-replay-clock.js`: local ReplayClock validator.
- `src/validate-replay-read-plan.js`: local ReplayReadPlan validator.
- `src/validate-replay-trace.js`: local ReplayTrace validator.
- `src/validate-replay-noop-run-summary.js`: local ReplayNoOpRunSummary validator.
- `src/validate-replay-evidence-bundle.js`: local ReplayEvidenceBundle validator.
- `src/validate-replay-run-report.js`: local ReplayRunReport validator.
- `fixtures/negative/`: deterministic negative validation fixtures.

## Commands

```powershell
npm run validate:replay-run-manifest
npm run validate:replay-clock
npm run validate:replay-read-plan
npm run validate:replay-trace
npm run validate:replay-noop-run-summary
npm run validate:replay-evidence-bundle
npm run validate:replay-run-report
npm run test:replay-engine
```

## Boundary

ReplayRunManifest is inventory and traceability only. It answers which local fake-data artifacts belong to a replay/accounting run.

ReplayClock and ReplayReadPlan are also metadata-only. They describe which local fixture records would be read and in what deterministic order. They do not execute replay logic, run strategies, generate EdgeSignals, create RiskDecisions, write paper ledger entries, write paper exits, calculate analytics, or recommend actions.

ReplayTrace and ReplayNoOpRunSummary are no-op replay outputs. They prove the shell can walk local fake-data read order, but they do not execute strategies, generate decisions, create trades, calculate edge, calculate bankroll metrics, or recommend actions.

ReplayEvidenceBundle and ReplayRunReport are no-op proof and report metadata. They tie together the validated replay manifest, clock, read plan, trace, and no-op summary, then report consistency totals without executing strategies, creating decisions, creating paper records, calculating analytics, or recommending actions.

## Validation

The manifest validator rejects malformed JSON, bad deterministic ids, unsafe paper/live/order flags, unknown artifact contracts, repo-escaping paths, credential or token paths, missing artifact files, duplicate artifact references, bad local record counts, unsafe validation commands, and forbidden strategy, bankroll, model-score, allocation, or recommendation fields.

Validation commands must remain local `npm run` scripts. Manifest validation must not execute replay logic, run strategies, connect to external systems, write ledger entries, write paper exits, calculate bankroll metrics, or recommend actions.

ReplayClock and ReplayReadPlan validators reject malformed JSON, bad deterministic ids, missing provenance, unsafe paper/live/order flags, invalid modes/statuses, empty event/read arrays, duplicate or non-contiguous indexes, unsafe artifact paths, invalid timestamps, invalid totals, non-local validation commands, and forbidden execution, strategy, bankroll, model-score, recommendation, order, or trade request fields.

ReplayTrace and ReplayNoOpRunSummary validators reject malformed fixtures, bad deterministic ids, missing provenance, unsafe paper/live/order flags, invalid modes/statuses, duplicate or non-contiguous trace indexes, unsafe artifact paths, invalid record references, inconsistent trace lifecycle records, inconsistent summary totals, and forbidden execution, strategy, bankroll, model-score, recommendation, order, or trade request fields.

ReplayEvidenceBundle and ReplayRunReport validators reject malformed JSON, bad deterministic ids, missing provenance, unsafe paper/live/order flags, invalid modes/statuses, unsafe artifact paths, unsafe validation commands, inconsistent no-op totals, failed ready consistency checks, and forbidden execution, strategy, bankroll, model-score, recommendation, order, or trade request fields.

Phase 1Z hardens ReplayEvidenceBundle and ReplayRunReport validation with dedicated negative fixtures. Evidence bundles must include exactly the known replay artifact types and required consistency checks. Run reports must use `consistency_passed`, `consistency_failed`, or `consistency_not_applicable`, and ready reports must use `consistency_passed`.

ReplayClock and ReplayReadPlan validation is intended to be frozen after Phase 1V unless a bug appears.

ReplayTrace and ReplayNoOpRunSummary validation is intended to be frozen after Phase 1X unless a bug appears.

ReplayEvidenceBundle and ReplayRunReport validation is intended to be frozen after Phase 1Z unless a bug appears.
