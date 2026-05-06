# Phase 2G: Offline Strategy Dry-Run Plan Contract

Phase 2G adds the StrategyDryRunPlan contract. It defines what a future offline dry-run may read and what it is forbidden to produce, without executing strategy logic.

## Scope

- Defines `StrategyDryRunPlan` schema version `strategy_dry_run_plan.v1`.
- Builds a deterministic synthetic dry-run plan from existing local StrategyDefinition, StrategyRunIntent, StrategyRunManifest, and StrategyRunEvidenceBundle fixtures.
- Validates provenance, deterministic ids, paper-only safety flags, allowed input artifact categories, forbidden outputs, metadata-only observation steps, and required safety constraints.

## Allowed Inputs

StrategyDryRunPlan may reference read-only local artifacts from safe categories:

- `strategy_definition`
- `strategy_run_intent`
- `strategy_run_trace`
- `strategy_noop_run_summary`
- `replay_trace`
- `replay_clock`
- `replay_read_plan`
- `market_state`

All artifact paths must be repo-relative local paths and must not reference credentials, env files, secrets, API keys, tokens, or live configs.

## Forbidden Outputs

Every plan must explicitly forbid:

- `live_order`
- `real_trade`
- `credential`
- `api_key`
- `bankroll_allocation`
- `recommendation`
- `edge_signal`
- `risk_decision`
- `action_decision`
- `paper_ledger_entry`
- `paper_exit`

## Observation Steps

Allowed step types are metadata-only:

- `read_strategy_contract`
- `read_strategy_intent`
- `read_replay_trace`
- `observe_market_state_metadata`
- `emit_noop_observation_trace`

Forbidden step types include strategy execution, edge calculation, signal generation, risk/action decision generation, paper entry/exit creation, trade recommendations, and order placement.

## Safety Constraints

Every plan must state:

- `no_network`
- `no_credentials`
- `no_live_execution`
- `no_order_placement`
- `no_strategy_recommendations`
- `no_bankroll_management`

## Boundary

This phase does not execute strategy logic, generate EdgeSignals, generate RiskDecisions, generate ActionDecisions, create PaperLedger entries, create PaperExits, calculate analytics, recommend trades, allocate bankroll, connect to Kalshi, create credentials, or make network calls.
