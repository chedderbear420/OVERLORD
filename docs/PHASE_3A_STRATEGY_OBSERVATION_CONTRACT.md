# Phase 3A: Strategy Observation Contract

Phase 3A opens the Phase 3 boundary with a strictly offline StrategyObservationContract and StrategyObservationInputSet. These records consume the frozen Phase 2 dry-run metadata stack as immutable input and define what a future observation pass may inspect.

This phase is contract and input inventory metadata only. It does not execute strategy logic, generate EdgeSignals, generate RiskDecisions, generate ActionDecisions, write PaperLedger entries, write PaperExits, calculate analytics, calculate bankroll metrics, recommend trades, place orders, connect to Kalshi, create credentials, add polling, add WebSockets, add live execution, add dashboard code, add ML code, add OpenClaw operation, add MiroFish integration, or make runtime network calls.

## Artifacts

- `packages/strategy-dsl/schemas/strategy_observation_contract.schema.json`
- `packages/strategy-dsl/schemas/strategy_observation_input_set.schema.json`
- `packages/strategy-dsl/fixtures/synthetic_strategy_observation_contract.json`
- `packages/strategy-dsl/fixtures/synthetic_strategy_observation_input_set.json`
- `packages/strategy-dsl/src/build-strategy-observation-contract.js`
- `packages/strategy-dsl/src/build-strategy-observation-input-set.js`
- `packages/strategy-dsl/src/strategy-observation-contract-id.js`
- `packages/strategy-dsl/src/strategy-observation-input-set-id.js`
- `packages/strategy-dsl/src/validate-strategy-observation-contract.js`
- `packages/strategy-dsl/src/validate-strategy-observation-input-set.js`

## Contract Shape

StrategyObservationContract records preserve the frozen Phase 2 closeout provenance, identify safe observation inputs, list forbidden observation outputs, and state metadata-only observation rules.

Allowed observation inputs are limited to:

- `strategy_definition`
- `strategy_run_intent`
- `strategy_dry_run_trace`
- `strategy_dry_run_noop_summary`
- `strategy_dry_run_case_file_summary`
- `replay_trace`
- `replay_clock`
- `replay_read_plan`
- `market_state_metadata`

Forbidden observation outputs include:

- `edge_signal`
- `risk_decision`
- `action_decision`
- `paper_ledger_entry`
- `paper_exit`
- `live_order`
- `real_trade`
- `credential`
- `api_key`
- `bankroll_allocation`
- `recommendation`
- `analytics`

Allowed observation rules are metadata-only:

- `read_only_inputs`
- `preserve_source_provenance`
- `emit_observation_metadata_only`
- `no_signal_generation`
- `no_decision_generation`
- `no_trade_generation`
- `no_recommendations`
- `no_bankroll_outputs`
- `no_network`

## Input Set Shape

StrategyObservationInputSet records inventory local read-only inputs derived from the frozen Phase 2 dry-run closeout checkpoint. Each artifact path remains a relative repo path and is validated locally before the input set can pass.

The input set is an inventory, not an observation execution result. It does not mutate source fixtures and does not emit strategy outputs.

## Safety Guarantees

- `paper_only` must be `true`.
- `live_execution_allowed` must be `false`.
- `order_placement_allowed` must be `false`.
- Artifact paths must be relative repo paths.
- Credential, env, secret, API-key, and live-config paths are rejected.
- Executable, runtime, live, network, order, trade, signal, decision, credential, bankroll, recommendation, and analytics fields are rejected anywhere in the records.
- Observation rules that imply execution, edge calculation, signal generation, decision generation, paper entries, paper exits, trade recommendations, bankroll allocation, order placement, or external connectivity are rejected.

## Validation

```powershell
npm run validate:strategy-observation-contract
npm run validate:strategy-observation-input-set
npm run test:strategy-dsl
```

## Recommended Next Boundary

Phase 3B should harden StrategyObservationContract and StrategyObservationInputSet with negative fixtures before any future observation trace layer is added.
