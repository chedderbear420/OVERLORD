# Phase 1Z: ReplayEvidenceBundle and ReplayRunReport Validation Hardening

Phase 1Z hardens the no-op replay evidence bundle and run report metadata.

This phase is validation-only. It does not execute strategies, generate signals, generate decisions, write paper ledger entries, write paper exits, calculate analytics, calculate bankroll metrics, recommend trades, connect to Kalshi, create credentials, or perform network calls.

## Scope

- Add deterministic negative fixtures for ReplayEvidenceBundle validation.
- Add deterministic negative fixtures for ReplayRunReport validation.
- Tighten evidence artifact contract validation.
- Tighten required consistency-check validation.
- Tighten report total and consistency-status validation.
- Keep everything local, offline, no-op, and dependency-free.

## ReplayEvidenceBundle Hardening

ReplayEvidenceBundle validation rejects:

- malformed JSON
- bad deterministic bundle ids
- missing provenance
- unsafe paper/live/order flags
- invalid replay modes or statuses
- missing evidence artifact arrays
- unknown or duplicate evidence artifact types
- evidence artifact paths that escape the repo
- credential, secret, `.env`, API-key, token, or live-config paths
- evidence artifact metadata that does not match the known replay evidence contract
- invalid consistency-check statuses
- missing required consistency checks
- ready bundles with failed consistency checks
- forbidden execution, strategy, bankroll, model, recommendation, order, trade, signal, decision, or analytics fields

## ReplayRunReport Hardening

ReplayRunReport validation rejects:

- malformed JSON
- bad deterministic report ids
- missing provenance
- unsafe paper/live/order flags
- invalid replay modes or statuses
- invalid consistency status values
- count fields that are negative or inconsistent with the local no-op replay evidence fixture
- ready reports whose consistency status is not `consistency_passed`
- forbidden execution, strategy, bankroll, model, recommendation, order, trade, signal, decision, or analytics fields

## Boundary

ReplayEvidenceBundle remains proof and inventory metadata only.

ReplayRunReport remains no-op replay report metadata only.

Neither artifact is a strategy result, trade recommendation, risk decision, paper trade, bankroll calculation, model evaluation, or live execution plan.

After this phase, Phase 1 replay evidence/report validation should be frozen unless a bug appears.
