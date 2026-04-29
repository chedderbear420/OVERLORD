# Phase 1B Event Validator

Phase 1B adds a strictly local validator for the Phase 1A event-store schemas and synthetic JSONL fixtures.

The validator proves that Overlord can reject malformed event envelopes before later modules trust raw evidence, replay inputs, audit records, or derived state.

## Scope

Phase 1B includes:

- Local JSONL parsing.
- Local schema validation for the schema features used by Phase 1A.
- Payload validation based on `payload_schema`.
- Deterministic validation reporting.
- SHA-256 payload hash verification.
- Synthetic fixture tests.

Phase 1B does not include:

- Kalshi API connectivity.
- Credentials or API key files.
- Polling.
- WebSocket clients.
- Order placement.
- Live execution.
- Dashboard code.
- Machine learning code.
- OpenClaw operation.
- MiroFish integration.

## Commands

Validate the synthetic fixture:

```powershell
npm run validate:event-store
```

Run event-store tests:

```powershell
npm run test:event-store
```

Both commands operate only against local repo files.

## Validation Rules

The validator checks:

- Each JSONL line parses as JSON.
- Each envelope validates against `event_envelope.v1`.
- Each payload validates against the declared payload schema.
- Supported payload schemas are `market_event.v1` and `audit_event.v1`.
- `event_id` values are unique.
- Envelope and payload ids match.
- Envelope and payload provenance fields match where applicable.
- `sequence_id` increases within each source stream.
- Fixture source is `synthetic_fixture`.
- `payload_hash` has valid shape and matches the canonical SHA-256 of the payload.
- Audit `subject_event_id` references are known locally or explicitly allowlisted as external.

## Hashing

`payload_hash` uses canonical JSON:

- Object keys are sorted recursively.
- Array order is preserved.
- Primitive JSON values use normal JSON encoding.
- The digest is encoded as `sha256:<hex>`.

This makes validation deterministic across platforms and file formatting changes.

## Dependencies

Phase 1B does not add third-party dependencies. It uses Node.js built-ins:

- `node:crypto`
- `node:fs/promises`
- `node:test`
- `node:assert/strict`

This avoids network installation and keeps validation local/offline.

