# Serious Architecture

Overlord separates evidence, interpretation, decisioning, simulation, and governance.

## Layers
- Raw recorder: captures source events and snapshots without mutation.
- Event store: stores immutable market evidence with source metadata.
- Normalizer: converts binary order book data into canonical MarketState records.
- Feature store: creates versioned features from reproducible inputs.
- Edge scanner: emits EdgeSignal candidates with full fee and risk context.
- Strategy registry and DSL: define strategy contracts, not live execution.
- Replay engine: reconstructs historical market states deterministically.
- Execution simulator: models fills, fees, slippage, queue assumptions, and missed fills.
- Paper trader: records simulated decisions and ledger outcomes.
- Calibration lab: evaluates probabilities, buckets, scorecards, and drift.
- Risk governor: blocks decisions that violate limits.
- Permission gate: controls future manual-confirm or restricted modes.
- Audit log: records every market event, signal, decision, and simulated result.

## Non-Negotiables
- Raw evidence is immutable.
- Derived data is versioned and reproducible.
- Strategies cannot bypass risk.
- Operators cannot override risk without audited permissions in a future approved phase.
- No current component may submit live orders.
