# Phase 1C Negative Validation

Phase 1C hardens the local event-store validator by proving it rejects malformed or unsafe fixture data deterministically.

All fixtures and tests are local/offline. This phase does not connect to Kalshi, create credentials, poll APIs, open WebSockets, place orders, run live execution, build dashboard code, or add machine learning code.

## Negative Fixtures

Negative fixtures live in `packages/event-store/fixtures/negative/`.

They cover:

- `duplicate_event_id.jsonl`
- `bad_payload_schema.jsonl`
- `non_monotonic_sequence.jsonl`
- `hash_mismatch.jsonl`
- `unknown_audit_reference.jsonl`
- `non_synthetic_source.jsonl`
- `malformed_jsonl.jsonl`
- `id_mismatch.jsonl`
- `missing_provenance.jsonl`
- `bad_schema_version.jsonl`

## Test Contract

Each negative fixture must:

- Fail validation.
- Produce a deterministic validation report or parse error.
- Include the expected failure message asserted by `packages/event-store/tests/negative-fixtures.test.js`.

The positive fixture must continue to pass.

## Commands

Run positive fixture validation:

```powershell
npm run validate:event-store
```

Run positive and negative tests:

```powershell
npm run test:event-store
```

## Notes

Some negative fixtures intentionally trigger more than one error. Tests assert the expected primary failure message while allowing secondary errors caused by the same malformed record, such as a hash mismatch after a payload field is changed.

