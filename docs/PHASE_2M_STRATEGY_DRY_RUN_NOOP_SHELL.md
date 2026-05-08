# Phase 2M: Offline Strategy Dry-Run No-Op Shell

Phase 2M adds a strictly offline no-op shell for the strategy dry-run stack.

The shell consumes validated `StrategyDryRunReadinessCheckpoint`, `StrategyDryRunPlan`, `StrategyDryRunPlanEvidenceSummary`, `StrategyRunTrace`, and `StrategyNoOpRunSummary` fixtures, verifies the readiness checkpoint is ready, walks the dry-run plan's metadata-only observation steps, and emits deterministic `StrategyDryRunTrace` records plus a `StrategyDryRunNoOpSummary`.

## Scope

- Read local synthetic fixtures only.
- Validate prerequisite metadata before trace generation.
- Walk `planned_observation_steps` deterministically.
- Emit no-op trace and summary metadata only.
- Preserve source strategy, run, manifest, evidence, dry-run plan, and readiness provenance.

## Out Of Scope

- Strategy execution.
- Edge calculation.
- Signal, risk decision, action decision, paper ledger, or paper exit generation.
- Strategy analytics, recommendations, bankroll logic, live trading, credentials, polling, WebSockets, Kalshi connections, dashboards, ML, OpenClaw, or MiroFish integration.

## Validation

Run:

```powershell
npm run validate:strategy-dry-run-trace
npm run validate:strategy-dry-run-noop-summary
npm run test:strategy-dsl
```

The dry-run trace validator requires sequential trace indexes, deterministic trace IDs, paper-only safety flags, allowed replay/run modes, allowed no-op trace event types, allowed metadata-only observation steps, and forbidden-field rejection.

The no-op summary validator requires deterministic summary IDs, paper-only safety flags, allowed readiness/status values, and trace/step count consistency.

## Boundary

`StrategyDryRunTrace` records prove only that the dry-run plan would observe metadata in a deterministic order. They do not prove profitability, strategy quality, trade advisability, or live execution readiness.
