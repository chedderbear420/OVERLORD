# packages/risk-governor

Offline independent risk governor and paper-only decision gate for Overlord Phase 1K.

This package consumes valid descriptive EdgeSignals and decides whether they are allowed to become paper-only candidates. It does not create paper trades, place orders, connect to Kalshi, create credentials, poll APIs, open WebSockets, run live execution, build dashboard code, train models, or add live action statuses.

## Contents

- `fixtures/default_risk_policy.json`: local paper-only risk policy.
- `fixtures/synthetic_risk_decisions.jsonl`: deterministic RiskDecision fixture.
- `fixtures/synthetic_action_decisions.jsonl`: deterministic ActionDecision fixture.
- `schemas/risk_policy.schema.json`: risk policy schema.
- `schemas/risk_decision.schema.json`: RiskDecision schema.
- `schemas/action_decision.schema.json`: ActionDecision schema.
- `src/risk-checks.js`: independent risk checks.
- `src/build-risk-decision.js`: EdgeSignal to RiskDecision builder.
- `src/build-action-decision.js`: RiskDecision to paper-only ActionDecision builder.
- `src/validate-risk-decisions.js`: local RiskDecision validator.

## Commands

```powershell
npm run validate:risk-decisions
npm run validate:action-decisions
npm run test:risk-governor
```

## Boundary

Risk Governor says whether a signal is safe enough to become a paper-only candidate. It does not say that a trade occurred, should occur, or should be executed.

## Validation

Phase 1L adds negative fixtures and validation hardening for malformed JSONL, missing provenance, deterministic ids, invalid statuses, forbidden live/order flags, non-paper-only actions, invalid exposure, inconsistent mappings, and non-monotonic decision ordering.

After Phase 1L, RiskDecision and ActionDecision validation should freeze unless a bug appears.

See `docs/PHASE_1K_RISK_GOVERNOR.md` and `docs/PHASE_1L_RISK_DECISION_VALIDATION.md`.
