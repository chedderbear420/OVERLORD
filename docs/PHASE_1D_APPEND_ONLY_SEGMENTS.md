# Phase 1D Append-Only Segments

Phase 1D adds a strictly local append-only JSONL segment writer and reader for validated event envelopes.

This phase proves Overlord can persist validated evidence in deterministic, replay-friendly segment files without mutation or overwrite behavior. It remains offline and does not connect to Kalshi, create credentials, poll APIs, open WebSockets, place orders, run live execution, build dashboard code, add machine learning code, or perform binary order book normalization.

## Scope

Phase 1D includes:

- Local segment filename helpers.
- Local JSONL segment writer.
- Local JSONL segment reader.
- Validation-before-append behavior.
- Append-only behavior tests.
- Deterministic read-order tests.
- Accepted and rejected append audit event returns.

Phase 1D does not include:

- Network ingestion.
- Live market recording.
- External storage.
- Segment compaction.
- Mutation, overwrite, or correction-in-place flows.
- Normalized `MarketState` generation.

## Segment Format

Segments are plain JSONL files. Each line is one immutable event envelope.

Segment filenames are deterministic:

```text
<source>-<YYYY-MM-DD>.jsonl
```

Example:

```text
synthetic_fixture-2026-04-28.jsonl
```

## Writer Rules

The writer must:

- Validate candidate envelopes before append.
- Reject invalid candidates before writing any bytes.
- Preserve existing segment bytes.
- Append new lines only.
- Refuse explicit segment creation when the segment already exists.
- Return deterministic errors for rejected appends.
- Return audit event envelopes for accepted and rejected append attempts.

The writer must not:

- Rewrite previous lines.
- Delete rejected records from a segment because rejected records never enter the valid segment.
- Modify existing segment records.
- Open network connections.

## Reader Rules

The reader must:

- Parse segment files as JSONL.
- Return envelopes in file order.
- Fail cleanly on malformed JSONL.

The reader does not normalize market state or run replay logic. It only returns stored envelopes.

## Audit Behavior

Append attempts return audit event envelopes:

- Accepted append: `record_appended` with `audit_status: "accepted"`.
- Rejected append: `record_rejected` with `audit_status: "rejected"`.

Audit events are returned to the caller in Phase 1D. They are not automatically written into the same valid segment. A later phase can decide whether to persist audit streams in dedicated audit segments.

## Commands

Validate the positive fixture:

```powershell
npm run validate:event-store
```

Run the event-store test suite:

```powershell
npm run test:event-store
```

