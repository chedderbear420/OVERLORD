---
name: binary-orderbook-normalizer
description: Use for binary order book normalization, YES/NO Kalshi books, MarketState schema, spread, liquidity, depth, implied prices, stale book detection, and microstructure features.
---

# Binary Orderbook Normalizer

## Purpose
Convert binary YES/NO order book evidence into canonical MarketState concepts for replay and edge scanning.

## When To Use
Use for MarketState design, YES/NO price normalization, spread/depth/liquidity calculations, and stale or inconsistent book checks.

## When Not To Use
Do not decide trades, generate live orders, or hide bad data quality.

## Required Inputs
- Raw book fields.
- Timestamp model.
- Price and size precision.
- Data quality rules.

## Procedure
1. Map YES and NO bid/ask sides into canonical executable prices.
2. Calculate spread, depth, liquidity, and implied complements.
3. Flag stale, crossed, locked, thin, or inconsistent books.
4. Link normalized output to raw event ids.

## Outputs
- MarketState schema, normalization rules, and data quality flags.

## Safety Checks
- Preserve raw references.
- Do not infer missing liquidity as available.
- Do not create execution instructions.

## Examples
- "Normalize a Kalshi binary order book."
- "Define MarketState liquidity fields."
