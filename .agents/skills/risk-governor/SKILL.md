---
name: risk-governor
description: Use for Overlord risk governor, risk limits, no-trade decisions, exposure caps, liquidity gates, spread gates, calibration gates, replay gates, kill switch planning, and permission controls.
---

# Risk Governor

## Purpose
Define independent risk controls that block invalid signals and unsafe strategy behavior.

## When To Use
Use for exposure limits, liquidity gates, spread gates, calibration gates, replay gates, no-trade reasons, permission gates, and kill switch planning.

## When Not To Use
Do not weaken risk rules to fit a strategy or add live execution authority.

## Required Inputs
- Strategy limits.
- Signal context.
- Market liquidity and spread.
- Replay and calibration status.

## Procedure
1. Validate paper-only mode.
2. Apply strategy, market, event, liquidity, calibration, replay, and exposure limits.
3. Return pass/block status with reasons.
4. Audit every decision.

## Outputs
- Risk policies, schemas, block reasons, and permission gate requirements.

## Safety Checks
- Risk cannot be bypassed by strategies, MiroFish, OpenClaw, dashboard, or operator.
- Block by default when required evidence is missing.

## Examples
- "Define risk limits for a strategy."
- "Add a no-trade reason taxonomy."
