# Phase 2F: StrategyRunManifest and StrategyRunEvidenceBundle Validation Hardening

Phase 2F hardens the no-op strategy-run inventory layer with deterministic negative fixtures. It remains strictly offline and validates metadata only.

## Scope

- StrategyRunManifest negative fixtures cover malformed JSON, deterministic id failures, missing provenance, unsafe safety flags, invalid modes/statuses, artifact contract failures, unsafe paths, credential-like paths, bad record counts, unsafe validation commands, and forbidden execution/signal/decision/order/recommendation/bankroll fields.
- StrategyRunEvidenceBundle negative fixtures cover malformed JSON, deterministic id failures, missing provenance, unsafe safety flags, invalid modes/statuses, evidence artifact contract failures, unsafe paths, credential-like paths, bad consistency check statuses, missing required consistency checks, failed checks on ready bundles, and forbidden execution/signal/decision/order/recommendation/bankroll fields.
- Positive StrategyRunManifest and StrategyRunEvidenceBundle fixture validation must continue to pass.

## Validation Rules

StrategyRunManifest validation requires paper-only safety flags, deterministic ids, allowed replay and run modes, known strategy artifact types, local repo-relative artifact paths, local npm validation commands, non-negative record counts, and all required no-op strategy artifacts.

StrategyRunEvidenceBundle validation requires paper-only safety flags, deterministic ids, known evidence artifact types, local repo-relative evidence artifact paths, non-negative record counts, required consistency checks, and no failed checks when the bundle is ready.

Both validators reject executable/runtime/live/network/order/trade/signal/decision/credential/bankroll/recommendation metadata anywhere in the record.

## Boundary

This phase does not execute strategies, generate signals, create decisions, write paper ledger entries, write paper exits, calculate analytics, recommend trades, allocate bankroll, connect to Kalshi, create credentials, or make network calls.

After Phase 2F, StrategyRunManifest and StrategyRunEvidenceBundle validation should be frozen unless a bug appears.
