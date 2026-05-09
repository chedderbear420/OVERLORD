# Phase 3B: Strategy Observation Contract Validation

Phase 3B hardens StrategyObservationContract and StrategyObservationInputSet validation with deterministic negative fixtures.

This phase is validation hardening only. It does not add a new observation pass, execute strategy logic, generate EdgeSignals, generate RiskDecisions, generate ActionDecisions, write PaperLedger entries, write PaperExits, calculate analytics, calculate bankroll metrics, recommend trades, place orders, connect to Kalshi, create credentials, add polling, add WebSockets, add live execution, add dashboard code, add ML code, add OpenClaw operation, add MiroFish integration, or make runtime network calls.

## Hardened Records

- StrategyObservationContract remains contract metadata only.
- StrategyObservationInputSet remains input inventory metadata only.

## Rejection Coverage

The negative fixtures prove rejection of:

- malformed JSON
- bad deterministic ids
- missing provenance
- unsafe safety flags
- invalid replay or run modes
- invalid statuses
- missing, unknown, or duplicate observation inputs
- missing forbidden observation outputs
- missing, unknown, or forbidden observation rules
- unknown or duplicated input artifact types
- bad input artifact record counts
- repo-escaping artifact paths
- credential, env, secret, API-key, token, or live-config paths
- executable/runtime/live/network/order/trade/signal/decision/credential/bankroll/recommendation/analytics fields anywhere in the records

## Safety Boundary

Observation contracts may define only what a future offline observation pass is allowed to read. Observation input sets may inventory only local read-only artifacts. Neither record may produce outputs, mutate source fixtures, connect externally, or imply any trading action.

## Commands

```powershell
npm run validate:strategy-observation-contract
npm run validate:strategy-observation-input-set
npm run test:strategy-dsl
```

## Freeze Recommendation

After Phase 3B, StrategyObservationContract and StrategyObservationInputSet validation should freeze unless a bug appears.
