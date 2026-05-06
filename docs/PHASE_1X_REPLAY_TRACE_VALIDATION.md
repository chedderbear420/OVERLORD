# Phase 1X: ReplayTrace and ReplayNoOpRunSummary Validation Hardening

Phase 1X hardens the strictly offline no-op replay trace layer added in Phase 1W.

This phase remains validation-only. It does not execute replay strategy logic, generate signals, generate risk decisions, create paper ledger entries, create paper exits, calculate analytics, calculate bankroll metrics, recommend trades, connect to Kalshi, or perform network calls.

## Scope

- Add deterministic negative fixtures for ReplayTrace JSONL validation.
- Add deterministic negative fixtures for ReplayNoOpRunSummary JSON validation.
- Strengthen ReplayTrace lifecycle validation.
- Strengthen ReplayNoOpRunSummary accounting consistency validation.
- Keep all checks local, offline, and dependency-free.

## ReplayTrace Hardening

ReplayTrace validation now rejects:

- malformed JSONL
- missing required provenance fields
- bad deterministic trace ids
- duplicate trace ids
- non-contiguous trace indexes
- unsafe paper/live/order flags
- invalid replay mode
- invalid trace event type
- invalid trace status
- invalid record timestamps
- unsafe artifact paths
- forbidden execution, order, strategy, bankroll, model, or recommendation fields
- record-read traces without a record id
- record-read traces whose record reference does not point at the artifact path
- no-op boundary traces that do not use replay control metadata
- trace streams that do not start with `noop_replay_started`
- trace streams that do not end with `noop_replay_completed` or `noop_replay_rejected`
- mixed source manifest, clock, or read-plan ids inside one trace stream

## ReplayNoOpRunSummary Hardening

ReplayNoOpRunSummary validation now rejects:

- malformed JSON
- missing required provenance fields
- bad deterministic summary ids
- unsafe paper/live/order flags
- invalid replay mode
- invalid summary status
- negative summary totals
- ready summaries that do not include start and completed trace records
- rejected summaries that report records read
- trace totals inconsistent with read totals
- artifact totals greater than records read
- forbidden execution, order, strategy, bankroll, model, or recommendation fields

## Validation Rules

- `paper_only` must remain `true`.
- `live_execution_allowed` must remain `false`.
- `order_placement_allowed` must remain `false`.
- ReplayTrace records must be append-friendly JSONL records.
- ReplayNoOpRunSummary must remain a single JSON object.
- Fixture paths must remain relative to the repo root.
- Credential, secret, `.env`, API-key, token, and live-config paths are rejected.
- Validation must not read from the network or execute replay strategy logic.

## Frozen Boundary

After Phase 1X, ReplayTrace and ReplayNoOpRunSummary validation should be frozen unless a bug appears. The next phase can move toward a replay execution shell contract only if it remains no-op or explicitly approved by a later phase.
