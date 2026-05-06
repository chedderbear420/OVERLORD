# packages/paper-trader

Strictly offline paper trading ledger for simulated paper-only candidate entries.

This package records replayable PaperLedgerEntry JSONL records from approved paper-only ActionDecision records. It does not create real trades, place orders, connect to Kalshi, create credentials, poll APIs, open WebSockets, run live execution, build dashboard code, train models, or add live order fields.

## Files

- `schemas/paper_ledger_entry.schema.json`: PaperLedgerEntry schema.
- `fixtures/synthetic_paper_ledger_entries.jsonl`: deterministic positive paper ledger fixture.
- `src/build-paper-ledger-entry.js`: pure builder from ActionDecision plus RiskDecision.
- `src/paper-ledger-reader.js`: JSONL reader preserving line order.
- `src/paper-ledger-writer.js`: append-only validated writer.
- `src/validate-paper-ledger.js`: local fixture validator.

## Commands

```powershell
npm run validate:paper-ledger
npm run test:paper-trader
```

## Boundaries

PaperLedgerEntry records are simulated only. A paper ledger entry is not a real trade, not a real order, and not a real exchange position.

Phase 1M does not implement exits, settlement, final P/L, strategy performance, bankroll management, or live execution.

Phase 1N adds negative fixture validation for malformed JSONL, missing provenance, bad deterministic ids, duplicate ids, non-monotonic ordering, unsafe live/order flags, non-paper-only records, invalid price/quantity/notional math, invalid event/status values, and non-null final P/L.

See `docs/PHASE_1M_PAPER_TRADING_LEDGER.md` and `docs/PHASE_1N_PAPER_LEDGER_VALIDATION.md`.
