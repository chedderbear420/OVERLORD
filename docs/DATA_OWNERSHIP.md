# Data Ownership

Overlord treats data as evidence. Each transformation must preserve provenance and reproducibility.

## Data Classes
- Raw market data: original snapshots, updates, timestamps, and source metadata.
- Normalized market state: canonical binary market representation.
- Features: reproducible inputs for strategies and models.
- Labels: resolved outcomes and short-horizon target definitions.
- Signals: candidate decisions with full economic and risk context.
- Simulated executions: paper fills, missed fills, fees, slippage, and ledger entries.
- Reports: replay, calibration, scorecards, and risk reviews.

## Ownership Rules
- Raw data belongs to the recorder and event store.
- Normalized state belongs to the normalizer and market-state engine.
- Feature and label definitions must be versioned.
- Signals must link back to market state, feature version, model version, and strategy version.
- Every decision must be audit logged.
