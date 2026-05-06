---
name: edge-signal-designer
description: Use for EdgeSignal schema, edge scanner, fee-aware expected value, net edge, model probability, market price, spread, slippage, liquidity, uncertainty penalty, timing, replay evidence, calibration, and risk status.
---

# Edge Signal Designer

## Purpose
Design signal records that prove whether a candidate edge survives all economic and governance checks.

## When To Use
Use for EdgeSignal schema, fee-aware EV, net edge, no-trade reasons, scanner outputs, and signal audit requirements.

## When Not To Use
Do not emit real orders or treat raw model probability as sufficient.

## Required Inputs
- MarketState reference.
- Model probability.
- Observed price.
- Fee, spread, slippage, liquidity, uncertainty, calibration, replay, and risk assumptions.

## Procedure
1. Require all signal validity fields.
2. Compute raw edge and net edge after costs and penalties.
3. Add pass/fail statuses for liquidity, timing, replay, calibration, and risk.
4. Record reason or no-trade reason.

## Outputs
- EdgeSignal schema, scanner contract, or validation checklist.

## Safety Checks
- A signal is valid only if every required check passes.
- No live order fields.
- Always audit blocked decisions.

## Examples
- "Design the EdgeSignal schema."
- "Add uncertainty penalty to edge calculation."
