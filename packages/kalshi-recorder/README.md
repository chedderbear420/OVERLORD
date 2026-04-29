# packages/kalshi-recorder

Planned black-box recorder boundary for Kalshi market evidence.

Current phase: offline schema foundation only. Do not connect to Kalshi yet.

## Phase 1A Boundary

The recorder package currently documents the future capture boundary and points to the local event-store schemas. It must not contain:

- Kalshi API clients.
- WebSocket clients.
- Polling loops.
- Credentials.
- API key files.
- Live order placement.
- Account-specific data.

## Future Responsibility

In a later approved integration phase, the recorder may capture source market snapshots, order book updates, timestamps, source sequence information, and provenance metadata.

Any future recorder output must be wrapped by `packages/event-store/schemas/event_envelope.schema.json` and must preserve raw market evidence for deterministic replay.

## Phase 1A Source Model

Allowed sources in Phase 1A schemas:

- `synthetic_fixture`
- `manual_import`
- `offline_recorder`

These are local/offline source labels only. They do not authorize network access or live integration.

## Audit Linkage

Every recorder append should be explainable through audit events. Future recorder workflows must emit or trigger audit records for append, validation, rejection, and supersession workflows.

See:

- `packages/event-store/schemas/market_event.schema.json`
- `packages/event-store/schemas/event_envelope.schema.json`
- `packages/event-store/schemas/audit_event.schema.json`
- `docs/PHASE_1A_EVENT_STORE_PLAN.md`
- `docs/AUDIT_EVENT_REQUIREMENTS.md`
