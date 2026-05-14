# Phase 5D — Gate Evaluation Summary

## Overview
Phase 5D evaluates the confidence gates defined in Phase 5A against the evidence indexed in Phase 5C. All gates fail/block. No gates pass. All advanced/live permissions remain blocked.

## Safety Invariants
- `gates_passed_count`: 0 (const)
- `safety_flags.gates_passed`: false (const)
- `safety_flags.phase_6_ready`: false (const)
- `safety_flags.live_mode_allowed`: false (const)
- `safety_flags.order_placement_allowed`: false (const)
- `safety_flags.credentials_allowed`: false (const)
- `safety_flags.autonomous_execution_allowed`: false (const)
- `safety_flags.operator_signoff_complete`: false (const)

## Files
- Schema: `kalshi_gate_evaluation_summary.schema.json`
- ID: `kalshi-gate-evaluation-summary-id.js`
- Builder: `build-kalshi-gate-evaluation-summary.js`
- Validator: `validate-kalshi-gate-evaluation-summary.js`
- Fixture: `synthetic_kalshi_gate_evaluation_summary.json`
- Tests: builder + validation tests

## Validate
\`\`\`bash
npm run validate:kalshi-gate-evaluation-summary
\`\`\`
