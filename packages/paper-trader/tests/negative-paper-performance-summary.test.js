import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validatePaperPerformanceSummaryFile } from "../src/validate-paper-performance-summary.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "paper-trader", "fixtures", "negative");

const negativeCases = [
  ["malformed_paper_performance_summary.json", /Expected ',' or '}'/],
  ["bad_paper_performance_summary_id.json", /paper_performance_summary_id must be deterministic/],
  ["missing_summary_provenance.json", /source_exit_fixture is required/],
  ["summary_unsafe_live_execution_allowed.json", /live_execution_allowed must be false/],
  ["summary_unsafe_order_placement_allowed.json", /order_placement_allowed must be false/],
  ["non_paper_only_summary.json", /paper_only must be true/],
  ["invalid_summary_type.json", /summary_type is invalid/],
  ["invalid_summary_status.json", /status is invalid/],
  ["bad_entry_count_math.json", /paper entry counts must not exceed ledger_record_count/],
  ["bad_exit_count_math.json", /paper exit counts must not exceed exit_record_count/],
  ["bad_open_closed_count_math.json", /open_paper_entries must equal total_paper_entries - closed_paper_entries/],
  ["bad_notional_totals.json", /total_entry_notional_cents must be a non-negative integer/],
  ["bad_gross_pnl_total.json", /total_gross_pnl_cents must be an integer/],
  ["bad_fee_total.json", /total_estimated_fees_cents must be a non-negative integer/],
  ["bad_net_pnl_total.json", /total_net_pnl_cents must equal total_gross_pnl_cents - total_estimated_fees_cents/],
  ["bad_win_loss_flat_counts.json", /exit outcome counts must sum to total_paper_exits/],
  ["forbidden_roi_field.json", /roi is forbidden/],
  ["forbidden_strategy_score_field.json", /strategy_score is forbidden/],
  ["forbidden_bankroll_field.json", /bankroll_growth is forbidden/]
];

for (const [fixtureName, expectedMessage] of negativeCases) {
  test(`${fixtureName} fails with expected PaperPerformanceSummary validation message`, async () => {
    const report = await validatePaperPerformanceSummaryFile({
      filePath: path.join(negativeDir, fixtureName)
    });

    assert.equal(report.ok, false);
    assert.match(report.errors.join("\n"), expectedMessage);
  });
}
