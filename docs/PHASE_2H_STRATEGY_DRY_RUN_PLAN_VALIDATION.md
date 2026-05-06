# Phase 2H: StrategyDryRunPlan Validation Hardening

Phase 2H hardens StrategyDryRunPlan validation with deterministic negative fixtures. It remains strictly offline and validates dry-run planning metadata only.

## Scope

- Adds malformed JSON rejection for StrategyDryRunPlan fixtures.
- Adds negative fixtures for deterministic id failures, missing provenance, unsafe safety flags, invalid modes/statuses, provenance id mismatch, unsafe artifact paths, credential-like paths, non-read-only inputs, missing forbidden outputs, forbidden observation steps, duplicate/non-sequential step indexes, non-metadata-only steps, invalid read references, missing safety constraints, and forbidden execution/signal/decision/order/recommendation/bankroll fields.
- Keeps positive StrategyDryRunPlan fixture validation passing.

## Validation Guarantees

StrategyDryRunPlan records must remain paper-only, local/offline, read-only, and metadata-only. They may define readable artifact categories and planned observation steps, but they cannot execute strategy logic or produce signals, decisions, trades, paper ledger entries, exits, recommendations, analytics, bankroll allocations, credentials, network behavior, or live order metadata.

## Boundary

This phase does not execute strategies, generate EdgeSignals, generate RiskDecisions, generate ActionDecisions, create PaperLedger entries, create PaperExits, calculate analytics, recommend trades, allocate bankroll, connect to Kalshi, create credentials, or make network calls.

After Phase 2H, StrategyDryRunPlan validation should be frozen unless a bug appears.
