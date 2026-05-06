# Phase 2A: Offline Strategy DSL Contract Skeleton

Phase 2A creates the first Strategy DSL contract skeleton for Overlord.

This phase is metadata-only. It does not execute strategy logic, generate EdgeSignals, generate RiskDecisions, generate ActionDecisions, create paper ledger entries, create paper exits, calculate strategy analytics, calculate bankroll metrics, recommend trades, connect to Kalshi, create credentials, poll, open WebSockets, or place orders.

## Scope

- Define StrategyDefinition schema.
- Define StrategyRunIntent schema.
- Add deterministic synthetic fixtures.
- Add deterministic ID helpers.
- Add local/offline validators.
- Add focused positive and negative tests.

## StrategyDefinition

StrategyDefinition records describe a future strategy contract without executable code.

Required safety flags:

- `paper_only: true`
- `live_execution_allowed: false`
- `order_placement_allowed: false`

Allowed strategy types:

- `noop_strategy_contract`
- `rule_based_strategy_contract`

Allowed input artifact categories:

- `market_state`
- `edge_signal`
- `replay_trace`
- `replay_clock`
- `replay_read_plan`

Required forbidden outputs:

- `live_order`
- `real_trade`
- `credential`
- `api_key`
- `bankroll_allocation`
- `recommendation`

## StrategyRunIntent

StrategyRunIntent records describe that a strategy definition could be attached to existing replay metadata for validation planning.

Allowed run modes:

- `validation_only`
- `dry_run_planned`

The synthetic fixture references the existing ReplayEvidenceBundle and ReplayRunManifest ids. It does not run the strategy or create any outputs.

## Forbidden Metadata

StrategyDefinition and StrategyRunIntent reject runtime or unsafe fields anywhere in the record, including executable code, handlers, callbacks, endpoints, credentials, polling, WebSockets, live orders, real trades, signal requests, decision requests, recommendations, and bankroll fields.

## Boundary

This package answers only what a strategy contract and replay attachment intent look like. It does not answer whether a strategy is good, profitable, eligible to trade, or worth allocating bankroll to.
