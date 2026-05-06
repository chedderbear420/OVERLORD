# Overlord Repo Instructions

## Product
Overlord is a serious Kalshi sports prediction-market research operating system.

Current phase: scope, repo constitution, and repo-scoped Codex skills only.

## Permanent Rules
- Overlord defaults to research-only and paper-only modes.
- Live execution is forbidden until explicitly added in a later approved phase.
- No autonomous live trading.
- No hardcoded secrets.
- No bypassing Kalshi terms, account rules, rate limits, or safety controls.
- Do not create API key files.
- Do not create real order-placement code.
- Do not connect to Kalshi until an approved integration phase.
- Do not copy external repo source code.
- Do not integrate OpenClaw or MiroFish yet.
- Every strategy must define entry, exit, stop, no-trade conditions, risk limits, and required features.
- Every signal must record market state, model probability, observed price, raw edge, fees, spread, slippage, uncertainty penalty, net edge, liquidity status, risk status, and reason.
- Every market event and decision must be audit logged.
- MiroFish is an optional future narrative simulation adapter, not a truth engine and not a trading authority.
- OpenClaw is a future operator/assistant layer, not the trading brain and never allowed to override risk or permissions.
- Machine learning cannot be promoted until clean data, labels, replay results, and calibration reports exist.

## Core Principle
A signal is valid only if model probability, market price, fees, spread, liquidity, timing, replay evidence, calibration history, and risk checks all pass.

## Edge Thesis
Overlord's edge is not predicting winners. Its edge is identifying and proving short-horizon mispricing caused by reaction lag, behavioral overreaction, and market microstructure inefficiency, then validating whether the opportunity survives fees, spread, liquidity, slippage, uncertainty, and risk limits.

## Engineering Boundaries
- Prefer deterministic replay, paper trading, audit trails, and calibration reports over live actions.
- Treat market data as immutable source evidence once recorded.
- Separate raw data, normalized market state, features, labels, signals, simulated fills, and decisions.
- Keep risk governance and permission gates independent from strategy logic.
- Use explicit schemas for market state, edge signals, paper ledger entries, and replay outputs.
- Never add code that can place, route, or submit a real order in the current phase.

## Repo-Scoped Skills
Use `.agents/skills/*/SKILL.md` when work touches Overlord architecture, Kalshi market recording, binary order book normalization, signal design, strategy DSL, replay, execution simulation, risk, paper trading, calibration, ML governance, MiroFish boundaries, OpenClaw boundaries, secrets, or QA.
