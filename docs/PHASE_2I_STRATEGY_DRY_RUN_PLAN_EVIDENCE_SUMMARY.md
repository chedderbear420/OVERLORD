# Phase 2I: Strategy Dry-Run Plan Evidence Summary

Phase 2I adds `StrategyDryRunPlanEvidenceSummary`, a strictly offline inventory record for a validated StrategyDryRunPlan.

## Scope

- Reads the local synthetic StrategyDryRunPlan fixture.
- Builds a deterministic evidence summary from source plan ids, validation status, and plan counts.
- Validates paper-only safety flags, deterministic ids, source provenance, allowed modes, status values, non-negative count fields, and count consistency against the source StrategyDryRunPlan.

## Summary Fields

The summary records:

- source StrategyDryRunPlan, StrategyDefinition, StrategyRunIntent, StrategyRunManifest, and StrategyRunEvidenceBundle ids
- replay and run modes
- allowed input artifact count
- forbidden output count
- planned observation step count
- safety constraint count
- validation status
- summary status and reason

## Boundary

This phase does not execute strategy logic, generate EdgeSignals, generate RiskDecisions, generate ActionDecisions, create PaperLedger entries, create PaperExits, calculate analytics, recommend trades, allocate bankroll, connect to Kalshi, create credentials, or make network calls.
