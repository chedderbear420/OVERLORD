# Phase 1A Event Store Plan

Phase 1A creates Overlord's offline black-box recorder foundation. It is schema-first, fixture-driven, append-only, immutable, and replay-friendly.

This phase does not connect to Kalshi, poll live APIs, open WebSockets, create credentials, place orders, or run live execution.

## Scope

Phase 1A defines:

- Raw market event schema.
- Immutable event envelope schema.
- Audit event schema.
- Synthetic JSONL fixtures for local validation.
- Append-only storage rules.
- Deterministic replay ordering rules.
- Audit linkage requirements.

Phase 1A does not define:

- Kalshi API clients.
- Credential handling beyond forbidding credentials in this phase.
- Live ingestion.
- Dashboard code.
- Machine learning code.
- Strategy execution.
- Order placement.

## Event Store Role

The event store preserves source evidence before normalization, features, signals, simulation, or strategy logic. Every record should be treated as immutable once appended.

The event store owns:

- Stable event identity.
- Source provenance.
- Capture and receipt timestamps.
- Sequence ordering.
- Schema version tracking.
- Payload integrity metadata.
- Replay availability boundaries.

The event store does not own:

- MarketState normalization.
- Feature generation.
- Edge calculations.
- Strategy decisions.
- Risk decisions.
- Paper fills.

## Required Provenance

Every event envelope and raw market event must include:

- `source`
- `captured_at`
- `received_at`
- `sequence_id`
- `schema_version`
- `event_id`

Use `correlation_id` when linking related records such as a source snapshot, follow-up audit event, replay run, or downstream derived record.

## Append-Only Design

Phase 1A storage is logical rather than implemented code. The intended append-only contract is:

1. New records are appended to a JSONL segment.
2. Existing lines are never edited in place.
3. Corrections are represented as new events that reference prior `event_id` values.
4. Deletions are not used for research records; invalid records are superseded by audit events or corrected follow-up events.
5. Event ordering is deterministic by `sequence_id`, then `captured_at`, then `received_at`, then `event_id`.
6. Every append should be auditable by a paired or subsequent audit event.

## Deterministic Replay Rules

Replay consumers must:

- Sort by `sequence_id` first.
- Use `captured_at` as the event-time clock.
- Use `received_at` as the data-availability clock.
- Break ties with `event_id`.
- Never read events with `received_at` after the replay cursor.
- Preserve source payloads without mutation.
- Record schema versions used for replay.

Replay consumers must not:

- Infer future data from later events.
- Normalize by rewriting raw source evidence.
- Drop invalid records silently.
- Treat synthetic fixtures as live market data.

## Validation Rules

Validation should run locally against JSONL fixtures and schemas.

Required checks:

- Each JSONL line is valid JSON.
- Each envelope validates against `packages/event-store/schemas/event_envelope.schema.json`.
- Market event payloads validate against `packages/event-store/schemas/market_event.schema.json`.
- Audit event payloads validate against `packages/event-store/schemas/audit_event.schema.json`.
- `event_id` is unique within a validation batch.
- `sequence_id` is unique and monotonically increasing within a source stream.
- `captured_at` and `received_at` are RFC 3339 timestamps.
- `received_at` is equal to or later than `captured_at` for offline recorder events.
- `schema_version` is explicit and stable.
- `payload_hash` is present when an envelope claims immutable storage.
- Envelope and payload event identifiers match when the payload has its own `event_id`.

Recommended checks:

- Audit events reference known event ids when `subject_event_id` is present.
- Correlated market and audit events share `correlation_id`.
- Event type names remain stable across schema versions.
- Fixtures contain no real credentials, account identifiers, or live API responses.

## Local Fixture Strategy

Phase 1A uses only synthetic JSONL fixtures. Fixtures should be small, readable, deterministic, and safe to commit.

Synthetic fixture records may include:

- Market created or status events.
- Order book snapshots.
- Order book deltas.
- Quote or ticker observations.
- Audit validation events.

Synthetic fixture records must not include:

- Real Kalshi account data.
- API keys.
- Live API output.
- Network-derived data.
- Order placement instructions.

## Phase 1A Acceptance Criteria

Phase 1A is acceptable when:

- Schemas exist for event envelopes, market events, and audit events.
- Synthetic JSONL fixtures demonstrate the contract.
- Docs explain append-only, replay, validation, and audit linkage rules.
- Package READMEs state the offline-only boundary.
- No code connects to Kalshi or any network service.
- No credentials or API key files are introduced.

