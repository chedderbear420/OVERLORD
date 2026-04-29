# packages/risk-governor

Offline independent risk governor and paper-only decision gate for Overlord Phase 1K.

This package consumes valid descriptive EdgeSignals and decides whether they are allowed to become paper-only candidates. It does not create paper trades, place orders, connect to Kalshi, create credentials, poll APIs, open WebSockets, run live execution, build dashboard code, train models, or add live action statuses.

## Contents

- `fixtures/default_risk_policy.json`: local paper-only risk policy.
- `fixtures/synthetic_risk_decisions.jsonl`: deterministic RiskDecision fixture.
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
npm run test:risk-governor
```

## Boundary

Risk Governor says whether a signal is safe enough to become a paper-only candidate. It does not say that a trade occurred, should occur, or should be executed.

See `docs/PHASE_1K_RISK_GOVERNOR.md`.
