# Phase 1G MarketState Integration

Phase 1G creates a strictly offline replay-ready `MarketState` layer.

It connects validated event-store market event envelopes to the binary YES/NO order book normalizer and emits descriptive MarketState records. It does not calculate edge, recommend trades, place orders, connect to Kalshi, poll APIs, open WebSockets, run live execution, add dashboard code, add machine learning code, implement paper trading, or implement fee-aware edge scanning.

## Input

The integration reads local event-store JSONL fixtures and selects only envelopes where:

- `event_type` is `market_event`
- `payload_schema` is `market_event.v1`
- `payload.orderbook` contains YES and NO bid books

Non-order-book market events are skipped with `no_orderbook_payload`.

Non-market events are skipped with `not_market_event`.

## MarketState Fields

Each MarketState record includes:

- `state_id`
- `schema_version`
- `source_event_id`
- `source_payload_hash`
- `source`
- `market_id`
- `captured_at`
- `received_at`
- `price_unit`
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

Prices remain integer cents from `0` to `100`.

## Provenance

MarketState records preserve:

- `source_event_id` from the event envelope `event_id`
- `source_payload_hash` from the event envelope `payload_hash`
- `source` from the event envelope `source`
- `market_id`, `captured_at`, and `received_at` from the market event payload

`state_id` is deterministic: `ms_<source_event_id>`.

## Fixture

`packages/market-state-engine/fixtures/synthetic_market_states.jsonl` is generated from the synthetic event-store fixture and contains only order-book market states.

## Commands

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

