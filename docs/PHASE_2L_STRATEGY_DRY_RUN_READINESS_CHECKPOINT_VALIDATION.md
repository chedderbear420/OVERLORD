# Phase 2L: StrategyDryRunReadinessCheckpoint Validation Hardening

Phase 2L hardens `StrategyDryRunReadinessCheckpoint` validation with deterministic negative fixtures.

## Scope

- Adds malformed, unsafe, incomplete, inconsistent, mismatched, path-unsafe, and forbidden-field negative fixtures.
- Confirms the positive synthetic readiness checkpoint fixture still validates.
- Confirms negative readiness checkpoint fixtures fail deterministically before any future dry-run shell can consume them.

## Validation Coverage

The validator rejects:

- malformed JSON
- bad deterministic checkpoint ids
- missing provenance
- unsafe paper-only flags
- invalid replay, run, readiness, and checkpoint statuses
- missing, unknown, or duplicate prerequisite artifacts
- missing, unknown, invalid, or failed readiness checks
- readiness/status consistency mismatches
- source id mismatches
- repo-escaping and credential-like artifact paths
- executable, runtime, live, network, signal, decision, order, trade, credential, recommendation, analytics, and bankroll fields

## Boundary

`StrategyDryRunReadinessCheckpoint` remains readiness metadata only. It does not execute strategy logic, generate EdgeSignals, generate RiskDecisions, generate ActionDecisions, create PaperLedger entries, create PaperExits, calculate analytics, recommend trades, allocate bankroll, connect to Kalshi, create credentials, or make network calls.
