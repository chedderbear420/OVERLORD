# Phase 4H: Artifact Manifest Update

## Goal

Seal the observation processing pipeline into the artifact manifest by adding the Phase 4F processing trace and Phase 4G noop summary as signed output artifacts with SHA-256 hashes. The manifest now records both what went in (7 read-only input artifacts) and what came out (2 processing output artifacts).

## Deliverables

### ID Helper Update

`packages/strategy-dsl/src/strategy-observation-processing-artifact-manifest-id.js`

Added `outputArtifactCount` and `outputHashCount` to the deterministic ID hash inputs. ID changes from `sopam_452c...` to `sopam_f925...` to reflect the expanded manifest shape.

### Builder Update

`packages/strategy-dsl/src/build-strategy-observation-processing-artifact-manifest.js`

Added:
- `processing_output_artifacts` — fixed list of 2 output artifacts (trace JSONL + noop summary JSON) with `artifact_type`, `artifact_path`, `artifact_id`, `record_count`
- `output_artifact_hashes` — SHA-256 hashes of the 2 output files, computed at build time
- `outputArtifactCount` and `outputHashCount` passed to ID helper

### Validator Update

`packages/strategy-dsl/src/validate-strategy-observation-processing-artifact-manifest.js`

Added:
- `processing_output_artifacts` and `output_artifact_hashes` to `requiredFields`
- `outputArtifactFields` allowed-field set for output artifact entries
- `validateOutputArtifacts()` — shape validation per output artifact entry
- `validateOutputHashes()` — SHA-256 hash verification against live files, same pattern as `validateHashes()`
- `outputArtifactCount` and `outputHashCount` fed into deterministic ID check

### Fixture Update

`packages/strategy-dsl/fixtures/synthetic_strategy_observation_processing_artifact_manifest.json`

Regenerated. Now contains `processing_output_artifacts` (2 entries) and `output_artifact_hashes` (2 SHA-256 hashes). Validator: PASS, 0 errors.

### Test Update

`packages/strategy-dsl/tests/build-strategy-observation-processing-artifact-manifest.test.js`

Added test: `seals Phase 4F/4G processing outputs` — asserts output artifact count, hash format, artifact types present, safety flags.

## What this phase does not include

- No new source files (updates only)
- No live data paths, Kalshi connectivity, credentials, or execution logic
- No signals, decisions, trades, recommendations, analytics, or bankroll outputs
- No changes to the validator logic for input artifacts or source provenance

## Phase prerequisites confirmed

| Check | Result |
|---|---|
| Phase 4F trace fixture present and validated | yes |
| Phase 4G noop summary fixture present and validated | yes |
| Phase 4H manifest validator: PASS, 0 errors | yes |
| 152 tests, 0 failures (no regressions) | yes |

## Completion rule

Phase 4H is complete when:

1. `npm run validate:strategy-observation-processing-artifact-manifest` → PASS, 0 errors
2. `npm run test:strategy-dsl` → 152+ tests, all pass
3. Manifest fixture contains `processing_output_artifacts` (2) and `output_artifact_hashes` (2)
4. No safety flag weakened anywhere

## Recommended next phase

**Phase 4I: Dashboard Processing Pipeline Panel**

Update `apps/dashboard/index.html` to display the Phase 4F trace record count, Phase 4G noop summary totals, and the Phase 4H manifest output artifact hashes — extending the existing offline read-only dashboard with the processing pipeline view.
