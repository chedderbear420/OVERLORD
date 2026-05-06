# Overlord

Overlord is a Kalshi sports prediction-market research operating system focused on short-horizon mispricing detection.

The project is currently in Phase 0: scope lock, repo constitution, planning documents, and repo-scoped Codex skills. It is research-only and paper-only. It does not connect to Kalshi, place orders, create API key files, or implement live trading.

## Mission
Overlord's first edge is detecting short-horizon mispricing in Kalshi sports prediction markets. The system focuses on reaction lag, behavioral overreaction, binary order book microstructure, fee-aware expected value, deterministic replay, paper trading, calibration, and risk governance.

## Core Principle
A signal is valid only if model probability, market price, fees, spread, liquidity, timing, replay evidence, calibration history, and risk checks all pass.

## Safety Posture
- Research-only and paper-only by default.
- Live execution is forbidden in the current phase.
- No autonomous live trading.
- No hardcoded secrets or API key files.
- No bypassing Kalshi terms, account rules, rate limits, or safety controls.
- Every event and decision must be audit logged.

## Planned System Areas
- Black box market recorder and event store.
- Binary order book normalizer and market state engine.
- Edge signal schema and edge scanner.
- Deterministic replay engine.
- Execution simulator and paper ledger.
- Strategy registry and strategy DSL.
- Calibration lab and scorecards.
- Risk governor and permission gate.
- Future MiroFish narrative simulation boundary.
- Future OpenClaw operator boundary.

See [docs/ROADMAP.md](docs/ROADMAP.md) and [docs/PRODUCT_SCOPE.md](docs/PRODUCT_SCOPE.md).
