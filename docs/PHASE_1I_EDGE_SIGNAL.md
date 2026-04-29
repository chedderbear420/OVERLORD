# Phase 1I EdgeSignal Schema and Fee-Aware Edge Math

Phase 1I adds a strictly offline descriptive EdgeSignal layer.

This phase answers only: "Does this candidate have fee-aware net edge?"

It does not answer: "Should we trade?"

## Scope

Phase 1I includes:

- EdgeSignal schema.
- Synthetic model probability fixtures.
- Synthetic EdgeSignal fixtures.
- Fee-aware edge math.
- Spread, slippage, fee, and uncertainty penalty utilities.
- Descriptive liquidity, staleness, edge, risk, and action eligibility fields.
- Validation and tests.

Phase 1I does not include live execution, paper trading, order placement, real risk-governor enforcement, dashboard code, machine learning, Kalshi connectivity, credentials, polling, WebSockets, OpenClaw operation, MiroFish integration, or runtime network calls.

## Price and Probability Model

Prices are integer cents from `0` to `100`.

`model_probability` is the probability of the selected signal side:

- For `side: "YES"`, it is the model probability of YES.
- For `side: "NO"`, it is the model probability of NO.

`observed_price` is the executable inferred ask from the MarketState for the selected side.

## Fee-Aware Math

The implemented formulas are:

```text
raw_edge = model_probability * 100 - observed_price
estimated_fee_cost = observed_price * fee_rate_bps / 10000
estimated_spread_cost = spread / 2
estimated_slippage_cost = spread * slippage_rate
uncertainty_penalty = uncertainty * 100
net_edge = raw_edge - fee - spread - slippage - uncertainty
```

Default assumptions:

- `fee_rate_bps = 100`
- `slippage_rate = 0.25`
- `min_net_edge = 1`

These assumptions are local research defaults only. They are not an execution model.

## Status Fields

`edge_status` can be:

- `positive`
- `negative`
- `zero_or_insufficient`
- `rejected`

`risk_status` is `not_evaluated` in Phase 1I. Real risk-governor enforcement is a later phase.

`action_eligibility` can be:

- `candidate_only`
- `rejected`
- `paper_eligible_candidate`

`paper_eligible_candidate` is reserved and rejected by validation in this phase.

## Rejection Rules

Signals are rejected when:

- MarketState staleness is not `fresh`.
- MarketState liquidity is not `liquid`.
- MarketState has quality flags.
- Fee-aware net edge is negative or below threshold.
- Price or probability inputs are invalid.

## Commands

```powershell
npm run validate:edge-signals
npm run test:edge-scanner
```

Existing foundations should still pass:

```powershell
npm run validate:market-state
npm run test:market-state-engine
npm run test:binary-book-normalizer
npm run validate:event-store
npm run test:event-store
```

