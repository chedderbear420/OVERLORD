import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateStrategyDryRunNoOpSummaryFile } from "../src/validate-strategy-dry-run-noop-summary.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "negative");

const cases = [
  ["malformed_strategy_dry_run_noop_summary.json", /Expected|Unexpected|JSON|position|end of JSON/i],
  ["bad_strategy_dry_run_noop_summary_id.json", /strategy_dry_run_noop_summary_id must be deterministic/],
  ["missing_strategy_dry_run_noop_summary_provenance.json", /generated_at is required/],
  ["strategy_dry_run_noop_summary_unsafe_live_execution_allowed.json", /live_execution_allowed must be false/],
  ["strategy_dry_run_noop_summary_unsafe_order_placement_allowed.json", /order_placement_allowed must be false/],
  ["non_paper_only_strategy_dry_run_noop_summary.json", /paper_only must be true/],
  ["invalid_strategy_dry_run_noop_summary_status.json", /status is invalid/],
  ["invalid_strategy_dry_run_noop_summary_readiness_status.json", /readiness_status is invalid/],
  ["bad_strategy_dry_run_total_trace_records.json", /total_trace_records must be a non-negative integer/],
  ["bad_strategy_dry_run_total_steps_observed.json", /total_steps_observed must be a non-negative integer/],
  ["bad_strategy_dry_run_summary_total_formula.json", /total_trace_records must equal total_steps_observed plus start and completed trace records/],
  ["summary_not_ready_with_ready_checkpoint.json", /dry_run_ready readiness_status requires dry_run_noop_summary_ready status/],
  ["forbidden_strategy_dry_run_noop_summary_execution_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_noop_summary_signal_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_noop_summary_decision_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_noop_summary_order_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_noop_summary_recommendation_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_noop_summary_bankroll_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_noop_summary_credential_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/]
];

test("negative StrategyDryRunNoOpSummary fixtures fail deterministically", async () => {
  for (const [fixtureName, expectedError] of cases) {
    const report = await validateStrategyDryRunNoOpSummaryFile({
      filePath: path.join(negativeDir, fixtureName)
    });

    assert.equal(report.ok, false, `${fixtureName} should fail validation`);
    assert.match(report.errors.join("\n"), expectedError, fixtureName);
  }
});
