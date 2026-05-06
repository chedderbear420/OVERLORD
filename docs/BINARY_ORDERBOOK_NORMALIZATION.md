# Binary Order Book Normalization

Kalshi markets are binary, so Overlord must normalize YES and NO order books into a canonical state before calculating edge.

## Canonical Concepts
- YES bid and ask.
- NO bid and ask.
- Implied complementary prices.
- Best executable price for each side.
- Spread in cents and probability terms.
- Depth by level and notional size.
- Liquidity status.
- Staleness and timestamp quality.

## Normalization Goals
- Make YES and NO prices comparable.
- Detect crossed, locked, stale, thin, or inconsistent books.
- Preserve raw source references.
- Avoid trading assumptions in normalization.

## Output
The normalizer should produce MarketState records suitable for replay, feature generation, edge scanning, and audit.
