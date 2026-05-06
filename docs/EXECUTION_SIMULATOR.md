# Execution Simulator

The execution simulator estimates whether a paper signal could plausibly have been filled after fees, spread, slippage, liquidity, and timing.

## Responsibilities
- Model executable prices.
- Apply fee assumptions.
- Estimate slippage.
- Account for spread and book depth.
- Track partial fills and missed fills.
- Record queue and latency assumptions.
- Produce paper ledger entries.

## Non-Responsibilities
- No live orders.
- No broker or exchange connectivity.
- No hidden API keys.

## Output
Simulation output must include fill status, fill price, fees, slippage, realized paper PnL, assumptions, and audit references.
