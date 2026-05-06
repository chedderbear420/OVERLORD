# packages/strategy-dsl

Strictly offline Strategy DSL contract package.

Phase 2A defines metadata-only StrategyDefinition and StrategyRunIntent records. These records describe future strategy shape and replay attachment intent, but they do not execute strategy logic, generate signals, create decisions, create paper ledger entries, create exits, calculate analytics, recommend trades, connect to Kalshi, or place orders.

## Files

- `schemas/strategy_definition.schema.json`: StrategyDefinition schema.
- `schemas/strategy_run_intent.schema.json`: StrategyRunIntent schema.
- `fixtures/synthetic_strategy_definition.json`: deterministic metadata-only strategy definition fixture.
- `fixtures/synthetic_strategy_run_intent.json`: deterministic metadata-only replay attachment intent fixture.
- `src/strategy-definition-id.js`: deterministic StrategyDefinition id helper.
- `src/strategy-run-intent-id.js`: deterministic StrategyRunIntent id helper.
- `src/validate-strategy-definition.js`: local StrategyDefinition validator.
- `src/validate-strategy-run-intent.js`: local StrategyRunIntent validator.

## Commands

```powershell
npm run validate:strategy-definition
npm run validate:strategy-run-intent
npm run test:strategy-dsl
```

## Boundary

StrategyDefinition is declarative contract metadata only. It may define allowed input artifact categories, blocked output categories, and inert parameter values.

StrategyRunIntent is replay attachment metadata only. It may reference a StrategyDefinition and existing replay evidence/manifest ids.

No strategy executable, handler, callback, network endpoint, order request, trade request, signal request, decision request, recommendation, bankroll allocation, credential, token, polling, WebSocket, or live execution field is allowed.
