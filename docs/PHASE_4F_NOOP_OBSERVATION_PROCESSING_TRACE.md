# Phase 4F: No-op Observation Processing Trace Shell

## Goal

Add the observation processing trace artifact that documents what processing inputs were seen during no-op offline strategy observation. Strictly metadata — no signals, decisions, recommendations, analytics, or execution outputs.

## Deliverables

### Schema

`packages/strategy-dsl/schemas/strategy_observation_processing_trace.schema.json`

JSON Schema draft 2020-12. `additionalProperties: false`. 23 required fields. Safety flag consts: `paper_only: true`, `live_execution_allowed: false`, `order_placement_allowed: false`. Trace event type enum: `noop_processing_started`, `noop_processing_input_seen`, `noop_processing_completed`, `noop_processing_rejected`. Observed input type is null or one of 7 processing input types.

### ID Helper

`packages/strategy-dsl/src/strategy-observation-processing-trace-id.js`

Deterministic SHA-256 ID. Inputs: contract ID, input-set ID, trace index, event type, observed input type, artifact path. Prefix: `sopt_`. 32 hex chars.

### Builder

`packages/strategy-dsl/src/build-strategy-observation-processing-trace.js`

Generates 9 JSONL records: 1 `noop_processing_started` + 7 `noop_processing_input_seen` (one per input artifact) + 1 `noop_processing_completed`. Imports contract and input-set builders. All safety flags locked. No strategy logic executed.

### Validator

`packages/strategy-dsl/src/validate-strategy-observation-processing-trace.js`

Per-record: required fields, `validateForbiddenFields`, core field validation (safety flags, replay_mode, run_mode, event type, status), ID shape checks, source consistency against local fixture IDs, deterministic ID recomputation, event-type/status correlation. Lifecycle: exactly one started (first), exactly one completed (last), all middle records input_seen.

### Synthetic Fixture

`packages/strategy-dsl/fixtures/synthetic_strategy_observation_processing_trace.jsonl`

9 records. Validator: PASS, 0 errors.

### Tests

`packages/strategy-dsl/tests/build-strategy-observation-processing-trace.test.js`
- Builder output matches fixture (deepEqual)
- Lifecycle structure, safety flags, ID prefix correct

`packages/strategy-dsl/tests/strategy-observation-processing-trace-validation.test.js`
- Fixture validates (PASS, 0 errors, 9 records)
- Rejects unsafe flags
- Rejects bad lifecycle order
- Rejects non-deterministic ID
- Rejects forbidden fields

### Package Script

`package.json`: `"validate:strategy-observation-processing-trace"` → `node packages/strategy-dsl/src/validate-strategy-observation-processing-trace.js`

## What this phase does not include

- No live data paths
- No Kalshi connectivity
- No credential handling
- No execution logic
- No signals, decisions, trades, recommendations, analytics, or bankroll outputs
- No changes to other validators, schemas, or fixtures

## Phase prerequisites confirmed

| Check | Result |
|---|---|
| Phase 4B boundary validators pass | yes |
| Phase 4C dashboard safety scan | yes |
| Phase 4E CLAUDE.md and repo-bootstrap skill | yes |
| No changes to existing validator or fixture files | yes |

## Completion rule

Phase 4F is complete when:

1. Validator script runs: PASS, 0 errors, 9 records
2. `npm run test:strategy-dsl` — all tests pass (no regressions)
3. All 5 new source files + 1 fixture + 2 tests + 1 phase doc committed
4. No forbidden field, no live flag, no execution output present in any artifact

## Recommended next phase

**Phase 4G: No-op Observation Processing Noop Summary**

Add the `strategy_observation_processing_noop_summary` artifact that closes out the observation processing pipeline — a single-record JSON summarizing what the no-op processor saw (input count, artifact types, timestamp range). Follows the same no-signal, no-execution contract as Phase 4F.
