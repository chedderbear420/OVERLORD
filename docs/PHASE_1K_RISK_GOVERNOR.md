# Phase 1K Risk Governor and Paper-Only Decision Gate

Phase 1K adds a strictly offline risk-governor layer that consumes valid descriptive EdgeSignals and emits paper-only decision records.

This phase answers only: "Can this valid EdgeSignal become a paper-only candidate?"

It does not answer:

- "Did we enter a trade?"
- "Should we place an order?"
- "Should we execute live?"

## Scope

Phase 1K includes:

- Risk policy fixture.
- RiskDecision schema and records.
- ActionDecision schema and records.
- Independent risk checks.
- Paper-only decision gate.
- Positive and negative tests.

Phase 1K does not include live execution, paper trade ledger entries, order placement, Kalshi connectivity, credentials, polling, WebSockets, OpenClaw operation, MiroFish integration, dashboard code, machine learning code, runtime network calls, or real order execution.

## Risk Checks

The default policy checks:

- Net edge minimum.
- Allowed liquidity status.
- Fresh staleness status.
- Fatal quality flags.
- Observed price bounds.
- Total estimated cost ceiling.
- Model probability bounds.
- Allowed side.
- EdgeSignal must be a positive candidate-only signal.

## Decision Statuses

Risk statuses:

- `risk_approved`
- `risk_rejected`
- `risk_needs_review`

Action statuses:

- `no_action`
- `rejected`
- `paper_candidate_allowed`

The only positive action status is `paper_candidate_allowed`.

## Paper-Only Boundary

ActionDecision records include:

- `paper_only: true`
- `live_execution_allowed: false`
- `order_placement_allowed: false`

They do not include order ids, order payloads, quantities, live routing fields, or paper ledger entries.

## Commands

```powershell
npm run validate:risk-decisions
npm run test:risk-governor
```

Existing foundations should still pass:

```powershell
npm run validate:edge-signals
npm run test:edge-scanner
npm run validate:market-state
npm run test:market-state-engine
npm run test:binary-book-normalizer
npm run validate:event-store
npm run test:event-store
```

