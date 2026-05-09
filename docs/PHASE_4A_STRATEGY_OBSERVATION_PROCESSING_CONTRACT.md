# Phase 4A: Strategy Observation Processing Contract

Phase 4A opens the Phase 4 boundary with a strictly offline `StrategyObservationProcessingContract` and `StrategyObservationProcessingInputSet`. These records consume the frozen Phase 3 observation metadata stack as immutable input and define how a future observation processing pass may inspect and summarize observation metadata into non-actionable processing metadata.

This phase is contract and input inventory metadata only. It does not execute strategy logic, generate EdgeSignals, generate RiskDecisions, generate ActionDecisions, write PaperLedger entries, write PaperExits, calculate analytics, calculate bankroll metrics, recommend trades, place orders, connect to Kalshi, create credentials, add polling, add WebSockets, add live execution, add dashboard code, add ML code, add OpenClaw operation, add MiroFish integration, or make runtime network calls.

## Artifacts

- `packages/strategy-dsl/schemas/strategy_observation_processing_contract.schema.json`
- `packages/strategy-dsl/schemas/strategy_observation_processing_input_set.schema.json`
- `packages/strategy-dsl/fixtures/synthetic_strategy_observation_processing_contract.json`
- `packages/strategy-dsl/fixtures/synthetic_strategy_observation_processing_input_set.json`
- `packages/strategy-dsl/src/build-strategy-observation-processing-contract.js`
- `packages/strategy-dsl/src/build-strategy-observation-processing-input-set.js`
- `packages/strategy-dsl/src/strategy-observation-processing-contract-id.js`
- `packages/strategy-dsl/src/strategy-observation-processing-input-set-id.js`
- `packages/strategy-dsl/src/validate-strategy-observation-processing-contract.js`
- `packages/strategy-dsl/src/validate-strategy-observation-processing-input-set.js`

## Contract Shape

`StrategyObservationProcessingContract` records preserve frozen Phase 3 observation stack provenance, identify safe processing inputs, list allowed non-actionable processing outputs, list forbidden outputs, and state metadata-only processing rules.

Allowed processing inputs are limited to:

- `strategy_observation_contract`
- `strategy_observation_input_set`
- `strategy_observation_trace`
- `strategy_observation_noop_summary`
- `strategy_observation_evidence_bundle`
- `strategy_observation_case_file_summary`
- `strategy_observation_stack_closeout_checkpoint`

Allowed processing outputs are non-actionable metadata only:

- `observation_processing_trace`
- `observation_processing_noop_summary`
- `observation_processing_evidence_bundle`
- `observation_processing_case_file_summary`

Forbidden processing outputs include:

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
- `strategy_analytics`

Allowed processing rules are metadata-only:

- `read_only_inputs`
- `preserve_source_provenance`
- `emit_processing_metadata_only`
- `no_signal_generation`
- `no_decision_generation`
- `no_trade_generation`
- `no_recommendations`
- `no_bankroll_outputs`
- `no_analytics`
- `no_network`

## Input Set Shape

`StrategyObservationProcessingInputSet` records inventory local read-only inputs from the frozen Phase 3 observation stack. Each artifact path remains a relative repo path and is validated locally before the input set can pass.

The input set is an inventory, not processing execution. It does not mutate source fixtures and does not emit strategy outputs.

## Safety Guarantees

- `paper_only` must be `true`.
- `live_execution_allowed` must be `false`.
- `order_placement_allowed` must be `false`.
- Artifact paths must be relative repo paths.
- Credential, env, secret, API-key, and live-config paths are rejected.
- Executable, runtime, live, network, order, trade, signal, decision, credential, bankroll, recommendation, and analytics fields are rejected anywhere in the records.
- Processing rules that imply execution, edge calculation, signal generation, risk/action decision generation, paper entries, paper exits, trade recommendations, bankroll allocation, performance or ROI calculation, order placement, or external connectivity are rejected.

## Validation

```powershell
npm run validate:strategy-observation-processing-contract
npm run validate:strategy-observation-processing-input-set
npm run test:strategy-dsl
```

## Recommended Next Boundary

Phase 4B should harden `StrategyObservationProcessingContract` and `StrategyObservationProcessingInputSet` with negative fixtures before any future observation processing trace layer is added.
