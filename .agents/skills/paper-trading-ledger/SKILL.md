---
name: paper-trading-ledger
description: Use for paper trading ledger, simulated decisions, paper positions, simulated fills, fees, slippage, paper PnL, audit trail, and non-live trading records.
---

# Paper Trading Ledger

## Purpose
Design ledger records for simulated trading decisions and outcomes.

## When To Use
Use for paper positions, simulated fills, fees, slippage, paper PnL, decision logs, and audit references.

## When Not To Use
Do not manage real balances, real orders, or exchange positions.

## Required Inputs
- EdgeSignal.
- Execution simulation output.
- Strategy version.
- MarketState references.

## Procedure
1. Record paper decision intent and reason.
2. Record simulated fill or missed-fill result.
3. Track fees, slippage, position, and PnL.
4. Link all entries to audit ids.

## Outputs
- Ledger schema, paper reports, and reconciliation rules.

## Safety Checks
- Label every record as paper/simulated.
- No live account identifiers.
- No real order ids.

## Examples
- "Design the paper ledger schema."
- "Add PnL attribution fields."
