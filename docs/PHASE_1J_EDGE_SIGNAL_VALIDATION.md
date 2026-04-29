# Phase 1J EdgeSignal Validation Hardening

Phase 1J hardens the offline EdgeSignal layer so malformed, inconsistent, stale, illiquid, or prematurely trade-eligible candidate signals are rejected before risk-governor or paper-trading logic can consume them.

This remains a validation-only phase. EdgeSignal records are descriptive only and do not recommend trades, size trades, create paper trades, place orders, connect to Kalshi, poll APIs, open WebSockets, create credentials, run live execution, add OpenClaw operation, add MiroFish integration, build dashboard code, add machine learning code, or make runtime network calls.

## Validation Coverage

The validator checks:

- Required provenance fields.
- Model probability bounds.
- Observed price bounds.
- Raw edge math.
- Net edge math.
- Non-negative cost and penalty fields.
- Deterministic signal ids.
- Deterministic fixture order by `received_at`.
- Stale signals marked eligible.
- Illiquid signals marked eligible.
- Reserved `paper_eligible_candidate` status.
- Malformed JSONL.

## Negative Fixtures

Negative fixtures live in `packages/edge-scanner/fixtures/negative/`.

They cover:

- `malformed_edge_signal_jsonl.jsonl`
- `missing_provenance.jsonl`
- `invalid_model_probability.jsonl`
- `bad_raw_edge_math.jsonl`
- `bad_net_edge_math.jsonl`
- `stale_signal_eligible.jsonl`
- `illiquid_signal_eligible.jsonl`
- `forbidden_paper_eligible_candidate.jsonl`
- `bad_signal_id.jsonl`
- `non_monotonic_signal_order.jsonl`

## Commands

```powershell
npm run validate:edge-signals
npm run test:edge-scanner
```

Existing foundations should still pass:

```powershell
npm run validate:market-state
npm run test:market-state-engine
npm run test:binary-book-normalizer
npm run validate:event-store
npm run test:event-store
```

After Phase 1J, EdgeSignal validation should freeze unless a bug appears. Phase 1K should move to Risk Governor plus paper-only decision gate.

