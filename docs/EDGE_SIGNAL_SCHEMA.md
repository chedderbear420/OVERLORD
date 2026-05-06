# EdgeSignal Schema

An EdgeSignal is a candidate research decision, not an order.

## Required Fields
- Signal id.
- Strategy id and version.
- Market id.
- Event timestamp and observed timestamp.
- MarketState reference.
- Model probability.
- Observed price.
- Raw edge.
- Fees.
- Spread.
- Slippage estimate.
- Uncertainty penalty.
- Net edge.
- Liquidity status.
- Timing status.
- Replay evidence status.
- Calibration status.
- Risk status.
- Decision reason.
- No-trade reason when blocked.

## Validity Rule
A signal is valid only if model probability, market price, fees, spread, liquidity, timing, replay evidence, calibration history, and risk checks all pass.

## Forbidden Use
EdgeSignal records must not contain instructions to place live orders in the current phase.
