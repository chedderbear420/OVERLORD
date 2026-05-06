import assert from "node:assert/strict";
import { test } from "node:test";
import { calculatePaperPerformance } from "../src/paper-performance-math.js";

test("calculatePaperPerformance summarizes fake paper accounting", () => {
  const summary = calculatePaperPerformance([ledgerEntry()], [paperExit()]);

  assert.deepEqual(summary, {
    total_paper_entries: 1,
    total_paper_exits: 1,
    open_paper_entries: 0,
    closed_paper_entries: 1,
    rejected_paper_entries: 0,
    rejected_paper_exits: 0,
    total_entry_notional_cents: 9996,
    total_exit_notional_cents: 12544,
    total_gross_pnl_cents: 2548,
    total_estimated_fees_cents: 0,
    total_net_pnl_cents: 2548,
    winning_paper_exits: 1,
    losing_paper_exits: 0,
    flat_paper_exits: 0
  });
});

test("calculatePaperPerformance counts winning, losing, and flat exits", () => {
  const exits = [
    { ...paperExit(), source_paper_ledger_entry_id: "a", net_pnl_cents: 10, gross_pnl_cents: 10, exit_notional_cents: 110 },
    { ...paperExit(), source_paper_ledger_entry_id: "b", net_pnl_cents: -5, gross_pnl_cents: -5, exit_notional_cents: 95 },
    { ...paperExit(), source_paper_ledger_entry_id: "c", net_pnl_cents: 0, gross_pnl_cents: 0, exit_notional_cents: 100 }
  ];
  const summary = calculatePaperPerformance([ledgerEntry("a"), ledgerEntry("b"), ledgerEntry("c")], exits);

  assert.equal(summary.winning_paper_exits, 1);
  assert.equal(summary.losing_paper_exits, 1);
  assert.equal(summary.flat_paper_exits, 1);
  assert.equal(summary.total_paper_exits, 3);
});

test("calculatePaperPerformance rejects unsafe source records", () => {
  assert.throws(() => calculatePaperPerformance([{ ...ledgerEntry(), paper_only: false }], []), /paper_only must be true/);
  assert.throws(() => calculatePaperPerformance([], [{ ...paperExit(), live_execution_allowed: true }]), /live_execution_allowed must be false/);
});

function ledgerEntry(id = "ledger_a") {
  return {
    paper_ledger_entry_id: id,
    ledger_event_type: "paper_entry_recorded",
    notional_cents: 9996,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false
  };
}

function paperExit(id = "ledger_a") {
  return {
    source_paper_ledger_entry_id: id,
    exit_event_type: "paper_exit_recorded",
    exit_notional_cents: 12544,
    gross_pnl_cents: 2548,
    estimated_fee_cents: 0,
    net_pnl_cents: 2548,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false
  };
}
