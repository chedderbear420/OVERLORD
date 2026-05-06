# Replay Engine

The replay engine reconstructs historical market state so strategy decisions can be tested deterministically.

## Purpose
- Rebuild market timelines from immutable events.
- Re-run strategies against historical evidence.
- Compare signals to later outcomes and simulated execution.
- Support reproducible calibration and scorecards.

## Requirements
- Deterministic ordering.
- Explicit clock model.
- Stable event ids.
- Versioned strategy and feature inputs.
- No lookahead leakage.
- Full audit output.

## Outputs
- Replayed MarketState stream.
- Strategy decision trace.
- EdgeSignal trace.
- Execution simulator input.
- Replay summary and diagnostics.
