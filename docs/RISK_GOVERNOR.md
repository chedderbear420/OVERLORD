# Risk Governor

The risk governor is an independent blocker for unsafe or invalid decisions.

## Responsibilities
- Enforce exposure limits.
- Enforce per-strategy limits.
- Enforce market and event concentration limits.
- Enforce liquidity and spread thresholds.
- Enforce calibration and replay requirements.
- Enforce paper-only mode in the current phase.
- Require no-trade reasons when blocking.

## Authority
Risk governance sits outside strategy logic. Strategies, MiroFish, OpenClaw, dashboards, and operators cannot bypass it.

## Current Rule
All outputs are research or paper decisions only. Live execution is forbidden.
