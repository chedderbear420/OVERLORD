# Roadmap

## Phase 0 / v0.0.1: Scope Lock, Repo Constitution, Skills
- Define product scope, edge thesis, architecture, safety rules, and repo-scoped Codex skills.
- No live integrations, no API keys, no order placement.

## Phase 1 / v0.1: Black Box Recorder and Event Store
- Design immutable recording for market snapshots, order book updates, timestamps, and source metadata.
- Preserve raw evidence before deriving features or signals.

## Phase 2 / v0.2: Binary Order Book Normalizer and MarketState
- Normalize Kalshi binary YES/NO books into canonical market state.
- Track spread, depth, liquidity, timestamps, and data quality.

## Phase 3 / v0.3: EdgeSignal Schema and Edge Scanner
- Define fee-aware net edge calculations.
- Require model probability, market price, fees, spread, slippage, liquidity, timing, uncertainty, and risk status.

## Phase 4 / v0.4: Replay Engine and Execution Simulator
- Reconstruct historical market states deterministically.
- Simulate fills, queue assumptions, slippage, fees, and missed fills.

## Phase 5 / v0.5: Strategy Registry, Strategy DSL, Paper Ledger
- Register strategies with entry, exit, stop, no-trade conditions, risk limits, and required features.
- Record paper decisions and simulated fills.

## Phase 6 / v0.6: Calibration Lab and Scorecards
- Evaluate probability calibration, edge buckets, Brier/log scores, PnL attribution, and decision quality.

## Phase 7 / v0.7: Context Engine and MiroFish Boundary Docs
- Define future narrative context boundaries.
- Keep MiroFish as optional simulation context, never a truth engine or trading authority.

## Phase 8 / v0.8: ML-Ready Feature Store, Labeling, and Model Registry
- Promote only clean, labeled, replay-tested, calibrated datasets into model workflows.

## Phase 9 / v0.9: Dashboard, Alerts, and OpenClaw Operator Boundary
- Build operator views for research, replay, scorecards, and alerts.
- Keep OpenClaw as an assistant/operator layer with no risk override authority.

## Phase 10 / v1.0: Demo/Manual-Confirm Operations Only After Gates Are Met
- Allow demo workflows and manual-confirm operations only after audit, replay, calibration, and risk gates pass.

## Phase 11 / v1.1+: Optional Restricted Live Mode
- Only after explicit approval, hard risk caps, kill switch, permission gates, and audit proof.
