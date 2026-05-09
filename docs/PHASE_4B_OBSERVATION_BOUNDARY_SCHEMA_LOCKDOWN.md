# Phase 4B: Observation Boundary Schema Lockdown

Phase 4B hardens the Phase 4A offline observation processing boundary.

This phase adds strict metadata-only boundary validation, schema lockdown, safe local artifact path validation, artifact manifest hashing, and red-team fixture coverage for malformed or unsafe generated metadata. It does not add strategy execution, analytics, recommendations, signals, decisions, order placement, ledger writes, Kalshi connectivity, credentials, polling, WebSockets, live config, dashboards, ML hooks, OpenClaw integration, MiroFish integration, or runtime network calls.

## Hardened Layers

- `StrategyObservationProcessingContract`
- `StrategyObservationProcessingInputSet`
- `StrategyObservationProcessingArtifactManifest`
- `validateObservationBoundary`

## Boundary Guard

The boundary guard recursively inspects Overlord-generated metadata and validation envelopes. It rejects:

- forbidden nested keys
- forbidden string values
- unsafe reason text
- unknown fields where strict whitelists apply
- unsafe local artifact paths

The scanner is case-insensitive and fail-closed. It does not strip, redact, repair, normalize, or continue silently after a violation.

`Kalshi` is not globally forbidden. Kalshi credential, token, secret, live endpoint, live API, and live/network behavior language remains forbidden.

Raw immutable source artifacts are not mutated or cleaned. When raw source payloads are inspected, value scanning can be disabled so ordinary historical market language does not cause a false rejection.

## Reason Codes

Phase 4B adds static reason codes:

- `ERR_FORBIDDEN_KEY_DETECTED`
- `ERR_FORBIDDEN_VALUE_DETECTED`
- `ERR_UNSAFE_PATH_DETECTED`
- `ERR_UNKNOWN_FIELD`
- `ERR_REASON_TEXT_UNSAFE`
- `ERR_SOURCE_MISMATCH`
- `ERR_RECORD_COUNT_MISMATCH`
- `ERR_HASH_MISMATCH`
- `VALIDATION_PASSED`

Human-readable `reason` text remains short and boring, and is scanned for unsafe content.

## Artifact Manifest

`StrategyObservationProcessingArtifactManifest` inventories the Phase 4A processing input artifacts and stores deterministic SHA-256 hashes for local synthetic fixtures.

The manifest is metadata-only. It records local snapshot evidence and validates that paths, record counts, hashes, and source provenance remain consistent.

## Path Safety

Phase 4B artifact paths must:

- be local relative paths
- stay under `packages/strategy-dsl/fixtures`
- resolve inside that approved fixture root
- not be URLs
- not be absolute paths
- not contain path traversal
- not be symlinks
- not reference credential, secret, env, API-key, token, or live-config-looking paths

## Validation

```powershell
npm run validate:strategy-observation-processing-contract
npm run validate:strategy-observation-processing-input-set
npm run validate:strategy-observation-processing-artifact-manifest
npm run test:strategy-dsl
```

## Boundary

Phase 4B remains offline, read-only, paper-only, metadata-only, non-executing, and non-actionable.

The recommended next phase is Phase 4C: add a strictly offline no-op observation processing trace shell only after the hardened contract and input manifest are accepted.
