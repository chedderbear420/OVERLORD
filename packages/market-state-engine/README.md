# packages/market-state-engine

Offline replay-ready MarketState integration layer for Overlord Phase 1G.

This package converts validated local event-store `market_event.v1` order book envelopes into normalized MarketState JSONL records using `packages/binary-book-normalizer`.

It does not connect to Kalshi, poll APIs, open WebSockets, create credentials, place orders, run live execution, calculate edge, recommend trades, build dashboard code, add machine learning code, implement paper trading, or implement fee-aware scanning.

## Contents

- `schemas/market_state.schema.json`: replay-ready MarketState schema.
- `fixtures/synthetic_market_states.jsonl`: deterministic MarketState fixture generated from synthetic event-store fixtures.
- `src/build-market-state.js`: pure transformation from event envelope to MarketState.
- `src/market-state-id.js`: deterministic state id helper.
- `src/market-state-reader.js`: local JSONL reader and fixture builder.

## Commands

```powershell
npm run test:market-state-engine
```

See `docs/PHASE_1G_MARKET_STATE_INTEGRATION.md`.
