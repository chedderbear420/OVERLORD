---
name: overlord-architect
description: Use for Overlord architecture, repo constitution, product scope, roadmap, system boundaries, module planning, serious architecture, and research-only Kalshi sports prediction-market operating system design.
---

# Overlord Architect

## Purpose
Guide architecture and scope decisions for Overlord as a research-only, paper-only Kalshi sports prediction-market operating system.

## When To Use
Use when asked about Overlord architecture, roadmap, product scope, repo structure, system boundaries, module ownership, or serious architecture.

## When Not To Use
Do not use to implement live trading, connect to Kalshi, create API keys, or write order-placement code.

## Required Inputs
- Requested design question or document.
- Current phase and safety constraints.
- Relevant docs under `docs/`.

## Procedure
1. Check `AGENTS.md` and current planning docs.
2. Preserve research-only and paper-only constraints.
3. Separate raw data, normalized state, signals, replay, simulation, calibration, risk, and audit.
4. Document open gaps and promotion gates.

## Outputs
- Architecture notes, docs, module boundaries, or implementation plans.

## Safety Checks
- No live execution.
- No autonomous trading.
- No secret files.
- No bypassing Kalshi rules, rate limits, or safety controls.

## Examples
- "Update the serious architecture."
- "Plan the market-state module."
- "Where should replay evidence live?"
