# Phase 1L RiskDecision and ActionDecision Validation

Phase 1L hardens RiskDecision and ActionDecision validation before any paper trading ledger can consume them.

This is a validation-only phase. RiskDecision and ActionDecision records are not trades, do not create paper ledger entries, do not place orders, do not connect to Kalshi, do not create credentials, do not poll APIs, do not open WebSockets, do not run live execution, do not add OpenClaw or MiroFish integration, do not build dashboard code, do not add machine learning code, and do not make runtime network calls.

## Validation Coverage

RiskDecision validation checks:

- Required provenance.
- Deterministic `risk_decision_id`.
- Allowed `risk_status` values.
- Non-empty risk reasons.
- Monotonic decision order by `received_at`.
- Clean malformed JSONL failure.

ActionDecision validation checks:

- Required provenance.
- Deterministic `action_decision_id`.
- Allowed `action_status` values.
- `paper_only: true`.
- `live_execution_allowed: false`.
- `order_placement_allowed: false`.
- Non-negative `max_paper_exposure_cents`.
- Consistent RiskDecision to ActionDecision mappings.
- Monotonic decision order by `received_at`.

## Negative Fixtures

Negative fixtures live in `packages/risk-governor/fixtures/negative/`.

They cover malformed JSONL, missing provenance, bad ids, invalid statuses, forbidden live/order flags, non-paper-only actions, invalid exposure, inconsistent approved/rejected mappings, and non-monotonic decision order.

## Commands

```powershell
npm run validate:risk-decisions
npm run validate:action-decisions
npm run test:risk-governor
```

Existing foundations should still pass:

```powershell
npm run validate:edge-signals
npm run test:edge-scanner
npm run validate:market-state
npm run test:market-state-engine
npm run test:binary-book-normalizer
npm run validate:event-store
npm run test:event-store
```

After Phase 1L, RiskDecision and ActionDecision validation should freeze unless a bug appears. Phase 1M should move to the Paper Trading Ledger.

