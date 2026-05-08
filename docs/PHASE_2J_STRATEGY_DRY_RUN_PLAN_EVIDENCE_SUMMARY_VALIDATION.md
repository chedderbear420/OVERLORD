# Phase 2J: StrategyDryRunPlanEvidenceSummary Validation Hardening

Phase 2J hardens `StrategyDryRunPlanEvidenceSummary` validation with deterministic negative fixtures.

## Scope

- Adds malformed, unsafe, inconsistent, mismatched, and forbidden-field negative fixtures.
- Confirms the positive synthetic summary fixture still validates.
- Confirms negative summary fixtures fail deterministically before any future execution or analytics layer can consume them.

## Validation Coverage

The validator rejects:

- malformed JSON
- bad deterministic summary ids
- missing provenance
- unsafe paper-only flags
- invalid replay, run, validation, and summary statuses
- invalid count fields
- source id mismatches
- validation/status consistency mismatches
- executable, runtime, live, network, signal, decision, order, trade, credential, recommendation, analytics, and bankroll fields

## Boundary

`StrategyDryRunPlanEvidenceSummary` remains validation and inventory metadata only. It does not execute strategy logic, generate EdgeSignals, generate RiskDecisions, generate ActionDecisions, create PaperLedger entries, create PaperExits, calculate analytics, recommend trades, allocate bankroll, connect to Kalshi, create credentials, or make network calls.
