# packages/binary-book-normalizer

Offline binary YES/NO order book normalizer for Overlord Phase 1F.

This package converts synthetic bid-only binary books into normalized market state fields. It does not connect to Kalshi, poll APIs, open WebSockets, create credentials, place orders, run live execution, calculate edge, or decide trades.

## Price Unit

Prices are integer cents from `0` to `100`.

## Contents

- `schemas/binary_orderbook.schema.json`: synthetic bid-book input schema.
- `schemas/normalized_orderbook.schema.json`: normalized output schema.
- `fixtures/synthetic_orderbooks.json`: local synthetic fixtures.
- `src/normalize-book.js`: pure normalization entry point.
- `src/book-math.js`: bid, implied ask, spread, mid, depth, and imbalance helpers.
- `src/liquidity-checks.js`: liquidity and staleness classification helpers.

## Commands

```powershell
npm run test:binary-book-normalizer
```

See `docs/PHASE_1F_BINARY_ORDERBOOK_NORMALIZER.md`.
