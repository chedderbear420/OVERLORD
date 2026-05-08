# Phase 2R: Strategy Dry-Run Stack Closeout Validation

Phase 2R hardens `StrategyDryRunStackCloseoutCheckpoint` validation with deterministic negative fixtures before the Phase 2 dry-run metadata stack is frozen.

## Scope

- Validate malformed JSON handling.
- Validate deterministic closeout checkpoint ids.
- Validate paper-only safety flags.
- Validate replay mode, run mode, readiness status, consistency status, freeze recommendation, and closeout status allowlists.
- Validate closeout artifact contracts, local paths, local record counts, and local npm validation commands.
- Validate required closeout checks and readiness/status/freeze consistency.
- Validate source id alignment against closeout artifact ids where practical.
- Reject executable, live, signal, decision, order, trade, recommendation, credential, analytics, and bankroll fields anywhere in closeout metadata.

## Freeze Meaning

`freeze_recommendation` is metadata-only. `freeze_ready` means the offline Phase 2 dry-run metadata stack is ready to freeze unless a validation bug appears. It does not mean trade, deploy, go live, execute, recommend, or allocate bankroll.

## Non-Scope

This phase does not execute strategy logic, calculate edge, generate signals, generate decisions, create paper ledger entries, create exits, recommend trades, allocate bankroll, connect to Kalshi, create credentials, poll, open WebSockets, or place orders.

## Validation

Run:

```powershell
npm run validate:strategy-dry-run-stack-closeout-checkpoint
npm run test:strategy-dsl
```

After this phase, freeze the Phase 2 dry-run metadata stack unless a bug appears.
