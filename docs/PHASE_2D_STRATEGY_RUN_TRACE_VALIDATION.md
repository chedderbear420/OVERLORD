# Phase 2D: StrategyRunTrace Validation Hardening

Phase 2D hardens StrategyRunTrace and StrategyNoOpRunSummary validation with negative fixtures. It remains a validation-only phase for no-op strategy trace metadata.

This phase does not execute strategy logic, generate signals, generate decisions, create paper ledger entries, create exits, calculate analytics, recommend trades, connect to Kalshi, or place orders.

## Scope

- Positive StrategyRunTrace fixture validation must continue to pass.
- Positive StrategyNoOpRunSummary fixture validation must continue to pass.
- Malformed JSON and JSONL fixtures must fail cleanly.
- Unsafe paper/live/order flags must fail.
- Deterministic ids must be enforced.
- StrategyRunTrace indexes must be unique and sequential.
- StrategyRunTrace observed input records must remain in deterministic order by `record_time`, `artifact_type`, and record identity.
- Artifact paths must remain local repo-relative paths and must not reference credentials, env files, secrets, API keys, tokens, or live configs.
- StrategyNoOpRunSummary count fields must remain non-negative and internally consistent.
- Executable/runtime/live/network/order/trade/signal/decision/credential/bankroll/recommendation/analytics fields must be rejected anywhere in trace or summary records.

## Negative Fixtures

StrategyRunTrace negative fixtures live in `packages/strategy-dsl/fixtures/negative/` and cover malformed JSONL, bad ids, missing provenance, unsafe flags, invalid event/status values, duplicate indexes, non-deterministic ordering, bad timestamps, unsafe paths, and forbidden execution/signal/decision/order/recommendation/bankroll fields.

StrategyNoOpRunSummary negative fixtures live in the same directory and cover malformed JSON, bad ids, missing provenance, unsafe flags, invalid status, inconsistent totals, and forbidden execution/signal/decision/order/recommendation/bankroll fields.

## Commands

```powershell
npm run validate:strategy-run-trace
npm run validate:strategy-noop-run-summary
npm run test:strategy-dsl
```

## Boundary

StrategyRunTrace remains no-op observation metadata only. StrategyNoOpRunSummary remains no-op observation summary metadata only. After Phase 2D, freeze these validators unless a bug is discovered.
