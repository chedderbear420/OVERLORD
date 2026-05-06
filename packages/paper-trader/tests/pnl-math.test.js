import assert from "node:assert/strict";
import { test } from "node:test";
import { calculatePaperPnl } from "../src/pnl-math.js";

test("calculatePaperPnl computes deterministic positive P/L in integer cents", () => {
  const pnl = calculatePaperPnl({
    paper_entry_price: 51,
    paper_exit_price: 64,
    paper_quantity: 196
  });

  assert.deepEqual(pnl, {
    entry_notional_cents: 9996,
    exit_notional_cents: 12544,
    gross_pnl_cents: 2548,
    estimated_fee_cents: 0,
    net_pnl_cents: 2548
  });
});

test("calculatePaperPnl supports YES and NO sides as descriptive contract prices", () => {
  const pnl = calculatePaperPnl({
    paper_entry_price: 60,
    paper_exit_price: 45,
    paper_quantity: 10
  });

  assert.equal(pnl.entry_notional_cents, 600);
  assert.equal(pnl.exit_notional_cents, 450);
  assert.equal(pnl.gross_pnl_cents, -150);
  assert.equal(pnl.net_pnl_cents, -150);
});

test("calculatePaperPnl rejects invalid prices and quantities", () => {
  assert.throws(() => calculatePaperPnl({ paper_entry_price: -1, paper_exit_price: 50, paper_quantity: 1 }), /paper_entry_price/);
  assert.throws(() => calculatePaperPnl({ paper_entry_price: 50, paper_exit_price: 101, paper_quantity: 1 }), /paper_exit_price/);
  assert.throws(() => calculatePaperPnl({ paper_entry_price: 50, paper_exit_price: 60, paper_quantity: 0 }), /paper_quantity/);
});
