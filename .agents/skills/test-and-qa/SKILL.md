---
name: test-and-qa
description: Use for Overlord test planning, QA strategy, deterministic replay tests, schema validation, audit tests, risk gate tests, calibration checks, and research-only acceptance criteria.
---

# Test and QA

## Purpose
Define test and QA practices for a research-only prediction-market evidence system.

## When To Use
Use for test plans, acceptance criteria, schema validation, replay determinism, audit checks, risk gate tests, and calibration QA.

## When Not To Use
Do not test live order placement in the current phase because live execution is forbidden.

## Required Inputs
- Component or document under review.
- Expected schemas or contracts.
- Safety constraints.

## Procedure
1. Identify deterministic behavior and schema invariants.
2. Add tests for auditability, no-lookahead, risk blocking, and paper-only behavior.
3. Include calibration and replay acceptance criteria when relevant.
4. Report residual risks and missing evidence.

## Outputs
- Test plans, QA checklists, acceptance criteria, or review findings.

## Safety Checks
- No live execution tests.
- No secret-dependent tests.
- Block promotion without replay, calibration, and risk evidence.

## Examples
- "Write QA criteria for replay."
- "Plan schema validation tests."
