---
name: execution-simulator-designer
description: Use for execution simulator, simulated fills, paper fills, Kalshi binary market fees, spread, slippage, liquidity, queue assumptions, latency, partial fills, and missed fills.
---

# Execution Simulator Designer

## Purpose
Design paper execution simulation that estimates fill plausibility and cost-adjusted outcomes.

## When To Use
Use for simulated fills, fee modeling, slippage, spread, queue assumptions, latency, partial fills, and missed fill logic.

## When Not To Use
Do not create real order placement, routing, or broker/exchange connectors.

## Required Inputs
- EdgeSignal candidate.
- MarketState stream.
- Fee assumptions.
- Fill model assumptions.

## Procedure
1. Define executable price assumptions.
2. Apply fees, spread, slippage, depth, and latency.
3. Model filled, partial, and missed outcomes.
4. Emit paper ledger entries with assumptions.

## Outputs
- Simulator design, fill schemas, ledger inputs, and diagnostics.

## Safety Checks
- Paper-only outputs.
- All assumptions recorded.
- No real order submission fields.

## Examples
- "Design fill simulation for thin books."
- "Add missed-fill reasons."
