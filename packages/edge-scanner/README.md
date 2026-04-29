# packages/edge-scanner

Offline descriptive EdgeSignal layer for Overlord Phase 1I.

This package calculates whether a replay-ready MarketState and synthetic model probability input produce fee-aware candidate edge. It does not place orders, recommend trades, create paper trades, connect to Kalshi, poll APIs, open WebSockets, create credentials, run live execution, build dashboard code, or train models.

## Contents

- `schemas/edge_signal.schema.json`: descriptive EdgeSignal schema.
- `fixtures/synthetic_model_probabilities.jsonl`: local synthetic probability inputs.
- `fixtures/synthetic_edge_signals.jsonl`: deterministic EdgeSignal fixture output.
- `src/edge-math.js`: raw edge, fee, spread, slippage, uncertainty, and net edge math.
- `src/build-edge-signal.js`: MarketState plus model probability to EdgeSignal builder.
- `src/edge-signal-id.js`: deterministic signal id helper.
- `src/validate-edge-signals.js`: local fixture validator.

## Commands

```powershell
npm run validate:edge-signals
npm run test:edge-scanner
```

## Boundary

EdgeSignal records are descriptive candidate signals only. They answer whether a candidate has fee-aware net edge. They do not answer whether Overlord should trade.

See `docs/PHASE_1I_EDGE_SIGNAL.md`.
