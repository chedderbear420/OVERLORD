# ML Governance

Machine learning is gated by data quality, replay proof, and calibration.

## Requirements
- Clean source data.
- Versioned feature definitions.
- Label definitions without lookahead leakage.
- Train/test split discipline.
- Replay-based validation.
- Calibration reports.
- Model registry entries.
- Risk review.

## Forbidden Shortcuts
- No promoting models from anecdotal wins.
- No using narrative simulation as truth.
- No live use without explicit future approval.
- No hidden datasets or untracked feature changes.
