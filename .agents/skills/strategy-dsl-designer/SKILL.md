---
name: strategy-dsl-designer
description: Use for Overlord strategy DSL, strategy registry, entry rules, exit rules, stop conditions, no-trade conditions, required features, risk limits, and strategy lifecycle gates.
---

# Strategy DSL Designer

## Purpose
Design declarative strategy definitions that are testable in replay and paper workflows.

## When To Use
Use for strategy schema, DSL syntax, registry metadata, lifecycle gates, required features, and no-trade contracts.

## When Not To Use
Do not add live order actions or strategy code that bypasses risk.

## Required Inputs
- Strategy intent.
- Required features.
- Entry, exit, stop, no-trade, and risk requirements.

## Procedure
1. Define explicit strategy fields and versioning.
2. Require entry, exit, stop, no-trade, risk limits, and required features.
3. Make outputs compatible with replay and paper trading.
4. Keep risk checks external and mandatory.

## Outputs
- Strategy DSL docs, schemas, examples, or registry requirements.

## Safety Checks
- No live execution verbs.
- No missing no-trade condition.
- No missing risk limit.

## Examples
- "Create a strategy DSL draft."
- "Define strategy registry metadata."
