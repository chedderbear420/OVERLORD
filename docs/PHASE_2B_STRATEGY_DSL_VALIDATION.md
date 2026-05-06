# Phase 2B: Strategy DSL Validation Hardening

Phase 2B hardens the offline Strategy DSL contract from Phase 2A with negative fixtures and deterministic failure tests. The package still defines metadata only; it does not execute strategies, generate signals, make decisions, create paper trades, calculate analytics, recommend trades, connect to Kalshi, or place orders.

## Scope

- Validate positive StrategyDefinition and StrategyRunIntent fixtures.
- Reject malformed JSON fixtures cleanly.
- Reject unsafe safety flags.
- Reject invalid deterministic ids, strategy types, run modes, replay modes, and statuses.
- Reject invalid allowed input categories.
- Reject missing required forbidden output blocks.
- Reject executable, runtime, network, credential, order, trade, decision, recommendation, and bankroll-shaped metadata fields anywhere in StrategyDefinition or StrategyRunIntent records.

## Negative Fixtures

StrategyDefinition negative fixtures live in `packages/strategy-dsl/fixtures/negative/` and cover malformed JSON, bad ids, missing provenance, unsafe safety flags, invalid strategy metadata, invalid inputs, missing forbidden outputs, and forbidden executable/network/credential/order/recommendation/bankroll fields.

StrategyRunIntent negative fixtures live in the same directory and cover malformed JSON, bad ids, missing provenance, unsafe safety flags, invalid run/replay/status metadata, missing strategy references, bad replay references, and forbidden execution/order/decision/recommendation/bankroll fields.

## Validation Rules

StrategyDefinition records must remain declarative contract metadata only. They may describe allowed local artifact input categories and required forbidden output categories, but they must not include executable handlers, callbacks, code, endpoints, credentials, order requests, trade requests, recommendations, bankroll allocation, or live execution controls.

StrategyRunIntent records must remain replay attachment metadata only. They may reference deterministic StrategyDefinition, ReplayEvidenceBundle, and ReplayRunManifest ids, but they must not contain action, execution, order, trade, signal, decision, recommendation, bankroll, credential, polling, WebSocket, or live-connectivity fields.

## Commands

```powershell
npm run validate:strategy-definition
npm run validate:strategy-run-intent
npm run test:strategy-dsl
```

## Boundary

This phase is validation hardening only. StrategyDefinition and StrategyRunIntent remain frozen as offline, paper-only contract metadata unless a bug is discovered.
