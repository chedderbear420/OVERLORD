# Phase 1F Binary Order Book Normalizer

Phase 1F begins Overlord's market-understanding layer with a strictly offline binary YES/NO order book normalizer.

The normalizer converts synthetic bid-only binary books into canonical normalized market state. It does not decide whether to trade, calculate edge, place orders, connect to Kalshi, poll APIs, open WebSockets, run live execution, build dashboard code, add machine learning code, or implement fee-aware signal logic.

## Price Representation

All prices are represented as integer cents from `0` to `100`.

Examples:

- `48` means 48 cents.
- `100` means 100 cents.
- A YES ask inferred from a NO bid is `100 - best_no_bid`.
- A NO ask inferred from a YES bid is `100 - best_yes_bid`.

## Input

The Phase 1F input is a synthetic binary book with:

- `market_id`
- `source_event_id`
- `captured_at`
- `received_at`
- `yes_bids`
- `no_bids`

Each side is an array of levels with:

- `price_cents`
- `quantity`

## Normalized Output

The normalizer emits:

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

## Quality Rules

The normalizer flags:

- Empty YES or NO sides.
- Invalid price bounds.
- Invalid quantities.
- Crossed books where bid plus opposite bid exceeds 100.
- Locked books where spread equals 0.
- Stale, missing, future, or invalid timestamps.
- Thin or invalid liquidity.

## Commands

Run binary-book normalizer tests:

```powershell
npm run test:binary-book-normalizer
```

Event-store foundation should continue to pass:

```powershell
npm run validate:event-store
npm run test:event-store
```

