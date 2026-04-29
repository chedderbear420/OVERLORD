# Audit Event Requirements

Overlord must be able to explain every market event, derived record, signal, decision, simulated fill, and replay result. Phase 1A begins that trail with local audit event records linked to immutable market evidence.

## Purpose

Audit events record what happened to evidence inside Overlord. They do not replace raw market events. They explain ingestion, validation, rejection, replay use, correction, and provenance checks.

## Required Fields

Audit event payloads must include:

- `event_id`
- `schema_version`
- `source`
- `captured_at`
- `received_at`
- `sequence_id`
- `audit_action`
- `audit_status`
- `actor`
- `reason`

Use `subject_event_id` when an audit event describes another event.

Use `correlation_id` when an audit event belongs to a larger capture, validation, or replay workflow.

## Audit Actions

Initial Phase 1A audit actions:

- `record_appended`
- `record_validated`
- `record_rejected`
- `record_superseded`
- `fixture_loaded`
- `replay_input_selected`

## Audit Status

Audit status values:

- `accepted`
- `rejected`
- `blocked`
- `superseded`
- `info`

Rejected or blocked records must include a specific `reason` and should include structured `details`.

## Linkage Rules

- Raw market event envelopes should be auditable by `event_id`.
- Audit events should reference source records using `subject_event_id`.
- Derived records in later phases must preserve references to source `event_id` values.
- Replay runs must record the input event ids and schema versions they used.
- Corrections must be append-only: create a new event and an audit event; do not modify the original line.

## Immutability Rules

Once appended:

- Do not edit an existing JSONL record.
- Do not reuse an `event_id`.
- Do not reuse a `sequence_id` in the same source stream.
- Do not replace raw source payloads.
- Do not delete invalid research evidence as a correction mechanism.

Invalid records should be followed by an audit event with `audit_action: "record_rejected"` or `audit_action: "record_superseded"`.

## Replay Requirements

Replay audit logs must make it possible to answer:

- Which event ids were included?
- Which schema versions were used?
- Which records were rejected or unavailable?
- What replay clock was used?
- Were any records excluded because of data availability or validation failures?

Replay must use `received_at` to determine what was knowable at the replay cursor and must not use later records to influence earlier decisions.

## Forbidden Audit Content

Audit events must not contain:

- API keys.
- Session tokens.
- Account credentials.
- Real order placement instructions.
- Private account data.
- Network call logs from live integrations in Phase 1A.

