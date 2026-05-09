# Phase 3F: Strategy Observation Evidence Validation Hardening

Phase 3F hardens the final observation evidence and case-file metadata layers.

This phase is validation hardening only. It adds deterministic negative fixtures for malformed, unsafe, inconsistent, incomplete, duplicated, live-capable, executable, signal-like, decision-like, order-like, recommendation-like, bankroll-like, credential-like, analytics-like, and path-unsafe observation case-file records.

## Hardened Layers

- `StrategyObservationEvidenceBundle`
- `StrategyObservationCaseFileSummary`

These layers remain evidence, inventory, and case-file metadata only. They do not execute strategy logic or produce strategy outputs.

## Negative Fixture Coverage

`StrategyObservationEvidenceBundle` fixtures cover:

- malformed JSON
- bad deterministic bundle IDs
- missing provenance
- unsafe safety flags
- invalid replay/run/status values
- missing, unknown, duplicate, and incomplete evidence artifacts
- unsafe and credential-like artifact paths
- invalid consistency check statuses
- missing required consistency checks
- failed checks with ready status
- source ID mismatches
- forbidden executable, signal, decision, order, recommendation, bankroll, analytics, and credential fields

`StrategyObservationCaseFileSummary` fixtures cover:

- malformed JSON
- bad deterministic case-file IDs
- missing provenance
- unsafe safety flags
- invalid replay/run/status/consistency values
- bad evidence, trace, and input totals
- ready status with failed consistency
- source ID mismatches
- forbidden executable, signal, decision, order, recommendation, bankroll, analytics, and credential fields

## Validation Guarantees

The validators enforce:

- `paper_only` must be `true`
- `live_execution_allowed` must be `false`
- `order_placement_allowed` must be `false`
- deterministic ID formats and derivation
- local relative artifact paths only
- no repo-escaping paths
- no credential, env, secret, API-key, or live-config paths
- exact observation evidence artifact contracts
- required consistency checks
- ready status only with passing consistency
- case-file totals aligned to local no-op observation fixtures where practical
- forbidden metadata field rejection throughout nested records

## Boundary

This phase does not:

- execute strategy logic
- generate EdgeSignals
- generate RiskDecisions
- generate ActionDecisions
- create PaperLedger entries
- create PaperExits
- calculate analytics
- calculate bankroll metrics
- recommend trades
- place orders
- connect to Kalshi
- create credentials
- add polling or WebSockets
- make runtime network calls

After this phase, `StrategyObservationEvidenceBundle` and `StrategyObservationCaseFileSummary` validation should freeze unless a bug appears.
