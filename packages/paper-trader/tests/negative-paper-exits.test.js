import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validatePaperExitFile } from "../src/validate-paper-exits.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "paper-trader", "fixtures", "negative");

const negativeCases = [
  ["malformed_paper_exit_jsonl.jsonl", /Invalid JSONL/],
  ["bad_paper_exit_id.jsonl", /paper_exit_id must be deterministic/],
  ["missing_paper_exit_provenance.jsonl", /source_signal_id is required/],
  ["paper_exit_unsafe_live_execution_allowed.jsonl", /live_execution_allowed must be false/],
  ["paper_exit_unsafe_order_placement_allowed.jsonl", /order_placement_allowed must be false/],
  ["non_paper_only_exit.jsonl", /paper_only must be true/],
  ["bad_entry_price_bounds.jsonl", /paper_entry_price must be integer cents from 0 to 100/],
  ["bad_exit_price_bounds.jsonl", /paper_exit_price must be integer cents from 0 to 100/],
  ["invalid_exit_quantity.jsonl", /paper_quantity must be a positive integer/],
  ["bad_entry_notional_math.jsonl", /entry_notional_cents must equal paper_entry_price \* paper_quantity/],
  ["bad_exit_notional_math.jsonl", /exit_notional_cents must equal paper_exit_price \* paper_quantity/],
  ["bad_gross_pnl_math.jsonl", /gross_pnl_cents must equal exit_notional_cents - entry_notional_cents/],
  ["bad_net_pnl_math.jsonl", /net_pnl_cents must equal gross_pnl_cents - estimated_fee_cents/],
  ["negative_estimated_fee.jsonl", /estimated_fee_cents must be a non-negative integer/],
  ["duplicate_paper_exit.jsonl", /paper_exit_id must be unique/],
  ["non_monotonic_paper_exit_order.jsonl", /received_at must be monotonic for paper exit order/],
  ["invalid_exit_event_type.jsonl", /exit_event_type is invalid/],
  ["invalid_exit_status.jsonl", /status is invalid/],
  ["inconsistent_status_event_mapping.jsonl", /paper_exit_recorded exits must have paper_closed status/]
];

for (const [fixtureName, expectedMessage] of negativeCases) {
  test(`${fixtureName} fails with expected PaperExit validation message`, async () => {
    const report = await validatePaperExitFile({
      filePath: path.join(negativeDir, fixtureName)
    });

    assert.equal(report.ok, false);
    assert.match(report.errors.join("\n"), expectedMessage);
  });
}
