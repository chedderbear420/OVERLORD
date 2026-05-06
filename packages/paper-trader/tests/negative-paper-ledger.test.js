import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validatePaperLedgerFile } from "../src/validate-paper-ledger.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "paper-trader", "fixtures", "negative");

const negativeCases = [
  ["malformed_paper_ledger_jsonl.jsonl", /Invalid JSONL/],
  ["missing_provenance.jsonl", /source_signal_id is required/],
  ["bad_paper_ledger_id.jsonl", /paper_ledger_entry_id must be deterministic/],
  ["duplicate_paper_ledger_id.jsonl", /paper_ledger_entry_id must be unique/],
  ["non_monotonic_ledger_order.jsonl", /received_at must be monotonic/],
  ["unsafe_live_execution_allowed.jsonl", /live_execution_allowed must be false/],
  ["unsafe_order_placement_allowed.jsonl", /order_placement_allowed must be false/],
  ["non_paper_only.jsonl", /paper_only must be true/],
  ["bad_notional_math.jsonl", /notional_cents must equal paper_entry_price \* paper_quantity/],
  ["bad_quantity.jsonl", /paper_quantity must be a positive integer for paper_open entries/],
  ["bad_entry_price.jsonl", /paper_entry_price must be integer cents from 1 to 99/],
  ["invalid_ledger_event_type.jsonl", /ledger_event_type is invalid/],
  ["invalid_status.jsonl", /status is invalid/],
  ["final_pnl_not_null.jsonl", /final_pnl_cents must be null/]
];

for (const [fixtureName, expectedMessage] of negativeCases) {
  test(`${fixtureName} fails with expected PaperLedger validation message`, async () => {
    const report = await validatePaperLedgerFile({
      filePath: path.join(negativeDir, fixtureName)
    });

    assert.equal(report.ok, false);
    assert.match(report.errors.join("\n"), expectedMessage);
  });
}
