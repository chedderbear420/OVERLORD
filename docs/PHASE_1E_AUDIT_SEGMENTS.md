# Phase 1E Audit Segments

Phase 1E adds dedicated append-only audit JSONL segments for event-store operations.

This is the final event-store foundation phase before binary YES/NO order book normalization. Event-store work should freeze after this phase unless a bug is discovered.

## Scope

Phase 1E includes:

- Dedicated audit segment writer.
- Dedicated audit segment reader.
- Audit envelope validation before append.
- Append-only audit segment tests.
- Traceability tests for accepted and rejected market append operations.

Phase 1E remains strictly local/offline. It does not connect to Kalshi, create credentials, poll APIs, open WebSockets, place orders, run live execution, add OpenClaw operation, add MiroFish integration, build dashboard code, add machine learning code, or implement binary order book normalization.

## Segment Separation

Market/event segments and audit segments are separate JSONL files.

Market/event segment:

```text
synthetic_fixture-2026-04-28.jsonl
```

Audit segment:

```text
audit-synthetic_fixture-2026-04-28.jsonl
```

Audit events are never automatically mixed into normal market event segments.

## Audit Writer Rules

The audit writer must:

- Accept only `audit_event` envelopes.
- Validate audit envelopes before append.
- Allow audit `subject_event_id` references to target records in separate market/event segments.
- Preserve append-only behavior.
- Reject invalid audit envelopes before writing.
- Refuse explicit audit segment creation when the file already exists.

The audit writer must not:

- Rewrite existing audit records.
- Delete or mutate prior audit lines.
- Write market envelopes into audit segments.
- Write rejected market records into valid market/event segments.

## Audit Reader Rules

The audit reader must:

- Parse audit JSONL files.
- Return audit envelopes in JSONL line order.
- Fail cleanly on malformed JSONL.
- Reject non-audit envelopes in audit segments.

## Traceability Rules

Accepted market append operations must be traceable to:

- `audit_action: "record_appended"`
- `audit_status: "accepted"`
- `subject_event_id` matching the appended market envelope id.

Rejected market append operations must be traceable to:

- `audit_action: "record_rejected"`
- `audit_status: "rejected"`
- `subject_event_id` matching the rejected envelope id when available.
- `reason` containing the deterministic validation failure.

Rejected market records must not be written into valid market/event segments.

## Commands

Validate the positive fixture:

```powershell
npm run validate:event-store
```

Run the event-store test suite:

```powershell
npm run test:event-store
```

