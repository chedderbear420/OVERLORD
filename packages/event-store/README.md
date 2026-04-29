# packages/event-store

Offline append-only event-store foundation for Overlord Phase 1A.

This package defines local schemas and synthetic fixtures for raw market evidence. It does not connect to Kalshi, poll APIs, open WebSockets, create credentials, place orders, or run live execution.

## Contents

- `schemas/event_envelope.schema.json`: immutable append-only wrapper.
- `schemas/market_event.schema.json`: raw market event payload schema.
- `schemas/audit_event.schema.json`: audit event payload schema.
- `fixtures/synthetic_market_events.jsonl`: synthetic JSONL fixture records.
- `src/segment-writer.js`: local append-only segment writer.
- `src/segment-reader.js`: local JSONL segment reader.
- `src/segment-paths.js`: deterministic segment filename helpers.
- `src/audit-events.js`: accepted/rejected append audit event helpers.
- `src/audit-segment-writer.js`: dedicated append-only audit segment writer.
- `src/audit-segment-reader.js`: dedicated audit segment reader.

## Design Contract

Every event must preserve:

- `event_id`
- `schema_version`
- `source`
- `captured_at`
- `received_at`
- `sequence_id`
- `correlation_id` when useful

Records are append-only. Existing records must not be edited to correct history. Corrections and rejections should be appended as new events and linked by `subject_event_id` or `correlation_id`.

## Replay Ordering

Replay consumers should order records by:

1. `sequence_id`
2. `captured_at`
3. `received_at`
4. `event_id`

Replay must use `received_at` as the data-availability boundary to avoid lookahead leakage.

## Validation Plan

Phase 1B adds a dependency-free local Node validator and tests.

Validate the synthetic fixture:

```powershell
npm run validate:event-store
```

Run tests:

```powershell
npm run test:event-store
```

Minimum validation checks:

- Parse each JSONL line.
- Validate every envelope against `event_envelope.schema.json`.
- Validate `market_event.v1` payloads against `market_event.schema.json`.
- Validate `audit_event.v1` payloads against `audit_event.schema.json`.
- Enforce unique `event_id` values.
- Enforce source-stream `sequence_id` monotonicity.
- Check audit `subject_event_id` references.
- Compute canonical payload SHA-256 and compare it to `payload_hash`.

Negative fixtures live in `fixtures/negative/` and prove deterministic rejection of malformed records.

## Append-Only Segments

Phase 1D adds local append-only segment helpers. Segments are plain JSONL files named deterministically from source and date, such as `synthetic_fixture-2026-04-28.jsonl`.

The writer validates before append, rejects invalid records before writing, and returns audit event envelopes for accepted and rejected append attempts. The reader returns envelopes in original file order and fails cleanly on malformed JSONL.

## Audit Segments

Phase 1E adds dedicated audit JSONL segments. Audit segments are separate from market/event segments and accept only `audit_event` envelopes.

Accepted appends can be traced through `record_appended` audit events. Rejected appends can be traced through `record_rejected` audit events while invalid records remain out of valid market/event segments.

After Phase 1E, the event-store foundation should freeze unless a bug is discovered. The next planned foundation area is binary YES/NO order book normalization.

See `docs/PHASE_1A_EVENT_STORE_PLAN.md`, `docs/PHASE_1B_EVENT_VALIDATOR.md`, `docs/PHASE_1C_NEGATIVE_VALIDATION.md`, `docs/PHASE_1D_APPEND_ONLY_SEGMENTS.md`, `docs/PHASE_1E_AUDIT_SEGMENTS.md`, and `docs/AUDIT_EVENT_REQUIREMENTS.md`.
