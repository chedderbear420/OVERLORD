---
name: replay-engine-designer
description: Use for deterministic replay engine, historical market reconstruction, event ordering, replay clock, no-lookahead validation, strategy decision traces, and replay evidence.
---

# Replay Engine Designer

## Purpose
Design deterministic replay so Overlord can prove decisions against historical evidence.

## When To Use
Use for replay architecture, event ordering, replay clocks, no-lookahead controls, decision traces, and replay reports.

## When Not To Use
Do not run live strategies or use future data in simulated decisions.

## Required Inputs
- Event store model.
- MarketState schema.
- Strategy version.
- Feature versions and clock assumptions.

## Procedure
1. Define deterministic event ordering.
2. Define replay clock and data availability rules.
3. Emit MarketState, features, EdgeSignals, and decision traces.
4. Produce reproducible replay evidence.

## Outputs
- Replay design, schemas, validation checks, and report formats.

## Safety Checks
- No lookahead leakage.
- Stable input versions.
- Full audit trace.

## Examples
- "Plan deterministic replay."
- "Define replay evidence for a signal."
