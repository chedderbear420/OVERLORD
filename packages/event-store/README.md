# packages/event-store

Offline append-only event-store foundation for Overlord Phase 1A.

This package defines local schemas and synthetic fixtures for raw market evidence. It does not connect to Kalshi, poll APIs, open WebSockets, create credentials, place orders, or run live execution.

## Contents

- `schemas/event_envelope.schema.json`: immutable append-only wrapper.
- `schemas/market_event.schema.json`: raw market event payload schema.
- `schemas/audit_event.schema.json`: audit event payload schema.
- `fixtures/synthetic_market_events.jsonl`: synthetic JSONL fixture records.

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

See `docs/PHASE_1A_EVENT_STORE_PLAN.md`, `docs/PHASE_1B_EVENT_VALIDATOR.md`, and `docs/AUDIT_EVENT_REQUIREMENTS.md`.
