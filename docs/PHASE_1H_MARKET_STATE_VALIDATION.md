# Phase 1H MarketState Validation

Phase 1H hardens the offline MarketState layer so malformed replay-ready market states are rejected before any EdgeSignal or trading logic can consume them.

This phase remains local, deterministic, and dependency-free. It does not connect to Kalshi, create credentials, poll APIs, open WebSockets, place orders, run live execution, add OpenClaw operation, add MiroFish integration, build dashboard code, add machine learning code, make runtime network calls, implement EdgeSignal logic, implement fee-aware scanning, or add paper trading.

## Scope

Phase 1H includes:

- Positive MarketState fixture validation.
- Negative MarketState fixtures.
- Malformed MarketState JSONL handling.
- Required provenance checks.
- Required normalized field checks.
- Integer cent price bounds.
- Spread and midpoint consistency checks.
- Deterministic `state_id` checks.
- Replay clock availability and monotonic order checks.

## Validation Rules

Required provenance fields:

- `state_id`
- `source_event_id`
- `source_payload_hash`
- `source`
- `market_id`
- `captured_at`
- `received_at`

Required normalized fields:

- `best_yes_bid`
- `best_yes_ask`
- `best_no_bid`
- `best_no_ask`
- `yes_spread`
- `no_spread`
- `yes_mid`
- `no_mid`
- `yes_depth`
- `no_depth`
- `book_imbalance`
- `liquidity_status`
- `staleness_status`
- `quality_flags`

Replay checks:

- `received_at` must be present and parseable.
- `received_at` must be equal to or after `captured_at`.
- Fixture records must be monotonic by `received_at`.

## Commands

Validate the positive fixture:

```powershell
npm run validate:market-state
```

Run MarketState tests:

```powershell
npm run test:market-state-engine
```

Existing foundations should still pass:

```powershell
npm run test:binary-book-normalizer
npm run validate:event-store
npm run test:event-store
```

After Phase 1H, MarketState validation should freeze unless a bug appears. Phase 1I should move to EdgeSignal schema and fee-aware edge math.

