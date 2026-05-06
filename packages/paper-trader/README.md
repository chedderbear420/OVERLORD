# packages/paper-trader

Strictly offline paper trading ledger for simulated paper-only candidate entries.

This package records replayable PaperLedgerEntry JSONL records from approved paper-only ActionDecision records. It does not create real trades, place orders, connect to Kalshi, create credentials, poll APIs, open WebSockets, run live execution, build dashboard code, train models, or add live order fields.

## Files

- `schemas/paper_ledger_entry.schema.json`: PaperLedgerEntry schema.
- `schemas/paper_exit.schema.json`: PaperExit schema.
- `schemas/paper_performance_summary.schema.json`: read-only PaperPerformanceSummary schema.
- `fixtures/synthetic_paper_ledger_entries.jsonl`: deterministic positive paper ledger fixture.
- `fixtures/synthetic_exit_prices.jsonl`: deterministic local exit price fixture.
- `fixtures/synthetic_paper_exits.jsonl`: deterministic positive PaperExit fixture.
- `fixtures/synthetic_paper_performance_summary.json`: deterministic read-only accounting summary fixture.
- `src/build-paper-ledger-entry.js`: pure builder from ActionDecision plus RiskDecision.
- `src/build-paper-exit.js`: pure builder from PaperLedgerEntry plus synthetic exit price.
- `src/build-paper-performance-summary.js`: pure read-only summary builder from ledger and exit records.
- `src/paper-performance-math.js`: deterministic fake-accounting aggregation math.
- `src/paper-ledger-reader.js`: JSONL reader preserving line order.
- `src/paper-ledger-writer.js`: append-only validated writer.
- `src/paper-exit-reader.js`: PaperExit JSONL reader preserving line order.
- `src/paper-exit-writer.js`: append-only validated PaperExit writer.
- `src/validate-paper-ledger.js`: local fixture validator.
- `src/validate-paper-exits.js`: local PaperExit fixture validator.
- `src/validate-paper-performance-summary.js`: local PaperPerformanceSummary fixture validator.

## Commands

```powershell
npm run validate:paper-ledger
npm run validate:paper-exits
npm run validate:paper-performance-summary
npm run test:paper-trader
```

## Boundaries

PaperLedgerEntry records are simulated only. A paper ledger entry is not a real trade, not a real order, and not a real exchange position.

Phase 1O adds simulated paper exits and fake P/L accounting. It does not implement real settlement, strategy performance, bankroll management, or live execution.

Phase 1N adds negative fixture validation for malformed JSONL, missing provenance, bad deterministic ids, duplicate ids, non-monotonic ordering, unsafe live/order flags, non-paper-only records, invalid price/quantity/notional math, invalid event/status values, and non-null final P/L.

Phase 1P adds negative fixture validation for malformed PaperExit JSONL, bad deterministic ids, missing provenance, unsafe live/order flags, non-paper-only exits, invalid price bounds, invalid quantity, notional/P/L math errors, duplicate exits, non-monotonic ordering, invalid event/status values, and inconsistent status/event mappings.

Phase 1Q adds a read-only fake-accounting summary. It aggregates valid paper ledger and paper exit records only. It does not calculate ROI, Sharpe ratio, bankroll growth, Kelly sizing, model ranking, strategy score, or recommendations.

See `docs/PHASE_1M_PAPER_TRADING_LEDGER.md`, `docs/PHASE_1N_PAPER_LEDGER_VALIDATION.md`, `docs/PHASE_1O_PAPER_EXIT_PNL.md`, `docs/PHASE_1P_PAPER_EXIT_VALIDATION.md`, and `docs/PHASE_1Q_PAPER_PERFORMANCE_SUMMARY.md`.
