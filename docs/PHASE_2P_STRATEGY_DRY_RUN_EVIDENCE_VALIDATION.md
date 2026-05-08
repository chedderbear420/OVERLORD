# Phase 2P: Strategy Dry-Run Evidence Validation

Phase 2P hardens `StrategyDryRunEvidenceBundle` and `StrategyDryRunCaseFileSummary` validation with deterministic negative fixtures. The layer remains strictly offline and metadata-only.

## Scope

- Validate malformed JSON handling.
- Validate deterministic evidence bundle and case-file summary ids.
- Validate paper-only safety flags.
- Validate replay mode and run mode allowlists.
- Validate dry-run evidence artifact contracts, local paths, record counts, and validation commands.
- Validate required consistency checks and ready-status consistency.
- Reject executable, signal, decision, order, trade, recommendation, credential, analytics, and bankroll fields anywhere in dry-run evidence or case-file metadata.

## Non-Scope

This phase does not execute strategy logic, calculate edge, generate signals, generate decisions, create paper ledger entries, create exits, recommend trades, allocate bankroll, connect to Kalshi, create credentials, poll, open WebSockets, or place orders.

## Validation Fixtures

Negative fixtures live under `packages/strategy-dsl/fixtures/negative` and are asserted by:

- `packages/strategy-dsl/tests/negative-strategy-dry-run-evidence-bundle.test.js`
- `packages/strategy-dsl/tests/negative-strategy-dry-run-case-file-summary.test.js`

The fixtures are inert rejection examples only. Credential-like paths and forbidden field names appear only to prove the validator rejects them.

## Freeze Recommendation

After Phase 2P, freeze `StrategyDryRunEvidenceBundle` and `StrategyDryRunCaseFileSummary` validation unless a bug appears.
