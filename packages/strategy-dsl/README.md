# packages/strategy-dsl

Strictly offline Strategy DSL contract package.

Phase 2A defines metadata-only StrategyDefinition and StrategyRunIntent records. These records describe future strategy shape and replay attachment intent, but they do not execute strategy logic, generate signals, create decisions, create paper ledger entries, create exits, calculate analytics, recommend trades, connect to Kalshi, or place orders.

Phase 2B adds negative fixture hardening for malformed, unsafe, executable, live-capable, credential-like, recommendation-like, bankroll-like, and invalid strategy contract metadata.

Phase 2C adds an offline no-op StrategyRunTrace shell. It observes validated replay trace metadata and emits strategy-run trace metadata only; it does not execute strategy logic or create signals, decisions, trades, recommendations, analytics, or bankroll actions.

Phase 2D adds negative fixture hardening for StrategyRunTrace and StrategyNoOpRunSummary malformed, unsafe, inconsistent, unordered, duplicated, executable, signal-like, decision-like, order-like, recommendation-like, and bankroll-like records.

Phase 2E adds StrategyRunManifest and StrategyRunEvidenceBundle metadata for the no-op strategy run. These records inventory and prove local strategy-run artifacts only; they do not execute strategy logic or create signals, decisions, trades, recommendations, analytics, or bankroll actions.

Phase 2F adds negative fixture hardening for StrategyRunManifest and StrategyRunEvidenceBundle malformed, unsafe, inconsistent, duplicated, missing, executable, signal-like, decision-like, order-like, recommendation-like, and bankroll-like records.

## Files

- `schemas/strategy_definition.schema.json`: StrategyDefinition schema.
- `schemas/strategy_run_intent.schema.json`: StrategyRunIntent schema.
- `schemas/strategy_run_trace.schema.json`: StrategyRunTrace schema.
- `schemas/strategy_noop_run_summary.schema.json`: StrategyNoOpRunSummary schema.
- `schemas/strategy_run_manifest.schema.json`: StrategyRunManifest schema.
- `schemas/strategy_run_evidence_bundle.schema.json`: StrategyRunEvidenceBundle schema.
- `fixtures/synthetic_strategy_definition.json`: deterministic metadata-only strategy definition fixture.
- `fixtures/synthetic_strategy_run_intent.json`: deterministic metadata-only replay attachment intent fixture.
- `fixtures/synthetic_strategy_run_trace.jsonl`: deterministic no-op strategy observation trace fixture.
- `fixtures/synthetic_strategy_noop_run_summary.json`: deterministic no-op strategy summary fixture.
- `fixtures/synthetic_strategy_run_manifest.json`: deterministic no-op strategy run artifact manifest fixture.
- `fixtures/synthetic_strategy_run_evidence_bundle.json`: deterministic no-op strategy run evidence bundle fixture.
- `fixtures/negative/*.json`: deterministic negative fixtures for StrategyDefinition, StrategyRunIntent, and StrategyNoOpRunSummary validation hardening.
- `fixtures/negative/*.jsonl`: deterministic negative fixtures for StrategyRunTrace validation hardening.
- `src/strategy-definition-id.js`: deterministic StrategyDefinition id helper.
- `src/strategy-run-intent-id.js`: deterministic StrategyRunIntent id helper.
- `src/strategy-run-trace-id.js`: deterministic StrategyRunTrace id helper.
- `src/strategy-noop-run-summary-id.js`: deterministic StrategyNoOpRunSummary id helper.
- `src/strategy-run-manifest-id.js`: deterministic StrategyRunManifest id helper.
- `src/strategy-run-evidence-bundle-id.js`: deterministic StrategyRunEvidenceBundle id helper.
- `src/run-noop-strategy.js`: local no-op strategy trace shell.
- `src/build-strategy-run-manifest.js`: local no-op strategy run manifest builder.
- `src/build-strategy-run-evidence-bundle.js`: local no-op strategy run evidence bundle builder.
- `src/validate-strategy-definition.js`: local StrategyDefinition validator.
- `src/validate-strategy-run-intent.js`: local StrategyRunIntent validator.
- `src/validate-strategy-run-trace.js`: local StrategyRunTrace validator.
- `src/validate-strategy-noop-run-summary.js`: local StrategyNoOpRunSummary validator.
- `src/validate-strategy-run-manifest.js`: local StrategyRunManifest validator.
- `src/validate-strategy-run-evidence-bundle.js`: local StrategyRunEvidenceBundle validator.

## Commands

```powershell
npm run validate:strategy-definition
npm run validate:strategy-run-intent
npm run validate:strategy-run-trace
npm run validate:strategy-noop-run-summary
npm run validate:strategy-run-manifest
npm run validate:strategy-run-evidence-bundle
npm run test:strategy-dsl
```

## Boundary

StrategyDefinition is declarative contract metadata only. It may define allowed input artifact categories, blocked output categories, and inert parameter values.

StrategyRunIntent is replay attachment metadata only. It may reference a StrategyDefinition and existing replay evidence/manifest ids.

No strategy executable, handler, callback, network endpoint, order request, trade request, signal request, decision request, recommendation, bankroll allocation, credential, token, polling, WebSocket, or live execution field is allowed.

Negative fixtures must fail deterministically and exist only to prove the validators reject unsafe or invalid metadata before any future strategy execution shell can consume it.

StrategyRunTrace is no-op observation metadata only. It may point to replay inputs that a future strategy would observe, but it must not include executable strategy runtime, signal requests, decision requests, order/trade requests, recommendations, analytics, bankroll allocation, credentials, polling, WebSockets, or live execution fields.

StrategyRunTrace and StrategyNoOpRunSummary negative fixtures must fail deterministically before any future strategy execution layer can consume them.

StrategyRunManifest and StrategyRunEvidenceBundle are inventory/proof metadata only. They may reference local Strategy DSL fixtures and validation commands, but they must not include executable strategy runtime, signal requests, decision requests, order/trade requests, recommendations, analytics, bankroll allocation, credentials, polling, WebSockets, or live execution fields.

StrategyRunManifest and StrategyRunEvidenceBundle negative fixtures must fail deterministically before any future strategy execution layer can consume them.
