import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateStrategyDryRunCaseFileSummaryFile } from "../src/validate-strategy-dry-run-case-file-summary.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "negative");

const cases = [
  ["malformed_strategy_dry_run_case_file_summary.json", /Expected|Unexpected|JSON|position|end of JSON/i],
  ["bad_strategy_dry_run_case_file_summary_id.json", /strategy_dry_run_case_file_summary_id must be deterministic/],
  ["missing_strategy_dry_run_case_file_summary_provenance.json", /generated_at is required/],
  ["strategy_dry_run_case_file_unsafe_live_execution_allowed.json", /live_execution_allowed must be false/],
  ["strategy_dry_run_case_file_unsafe_order_placement_allowed.json", /order_placement_allowed must be false/],
  ["non_paper_only_strategy_dry_run_case_file_summary.json", /paper_only must be true/],
  ["invalid_strategy_dry_run_case_file_replay_mode.json", /replay_mode is invalid/],
  ["invalid_strategy_dry_run_case_file_run_mode.json", /run_mode is invalid/],
  ["invalid_strategy_dry_run_case_file_readiness_status.json", /readiness_status is invalid/],
  ["invalid_strategy_dry_run_case_file_consistency_status.json", /consistency_status is invalid/],
  ["invalid_strategy_dry_run_case_file_status.json", /status is invalid/],
  ["bad_strategy_dry_run_case_file_total_evidence_artifacts.json", /total_evidence_artifacts must be a non-negative integer|total_evidence_artifacts must equal/],
  ["bad_strategy_dry_run_case_file_total_trace_records.json", /total_trace_records must be a non-negative integer/],
  ["bad_strategy_dry_run_case_file_total_steps_observed.json", /total_steps_observed must be a non-negative integer/],
  ["bad_strategy_dry_run_case_file_total_formula.json", /total_trace_records must equal total_steps_observed plus start and completed trace records/],
  ["ready_case_file_with_failed_consistency.json", /ready dry-run case-file summaries require consistency_passed/],
  ["ready_case_file_with_not_ready_readiness.json", /ready dry-run case-file summaries require dry_run_ready readiness_status/],
  ["forbidden_strategy_dry_run_case_file_execution_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_case_file_signal_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_case_file_decision_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_case_file_order_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_case_file_recommendation_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_case_file_bankroll_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_case_file_credential_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/]
];

test("negative StrategyDryRunCaseFileSummary fixtures fail deterministically", async () => {
  for (const [fixtureName, expectedError] of cases) {
    const report = await validateStrategyDryRunCaseFileSummaryFile({
      filePath: path.join(negativeDir, fixtureName)
    });

    assert.equal(report.ok, false, `${fixtureName} should fail validation`);
    assert.match(report.errors.join("\n"), expectedError, fixtureName);
  }
});
