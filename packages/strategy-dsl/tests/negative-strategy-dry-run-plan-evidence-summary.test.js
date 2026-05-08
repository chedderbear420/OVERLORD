import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateStrategyDryRunPlanEvidenceSummaryFile } from "../src/validate-strategy-dry-run-plan-evidence-summary.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "negative");

const cases = [
  ["malformed_strategy_dry_run_plan_evidence_summary.json", /Expected|Unexpected|JSON|position|end of JSON/i],
  ["bad_strategy_dry_run_plan_evidence_summary_id.json", /strategy_dry_run_plan_evidence_summary_id must be deterministic/],
  ["missing_strategy_dry_run_plan_evidence_summary_provenance.json", /generated_at is required/],
  ["strategy_dry_run_plan_summary_unsafe_live_execution_allowed.json", /live_execution_allowed must be false/],
  ["strategy_dry_run_plan_summary_unsafe_order_placement_allowed.json", /order_placement_allowed must be false/],
  ["non_paper_only_strategy_dry_run_plan_summary.json", /paper_only must be true/],
  ["invalid_strategy_dry_run_plan_summary_replay_mode.json", /replay_mode is invalid/],
  ["invalid_strategy_dry_run_plan_summary_run_mode.json", /run_mode is invalid/],
  ["invalid_strategy_dry_run_plan_summary_validation_status.json", /validation_status is invalid/],
  ["invalid_strategy_dry_run_plan_summary_status.json", /status is invalid/],
  ["bad_allowed_input_artifact_count.json", /allowed_input_artifact_count must be a non-negative integer/],
  ["bad_forbidden_output_count.json", /forbidden_output_count must be a non-negative integer/],
  ["bad_planned_observation_step_count.json", /planned_observation_step_count must be a non-negative integer/],
  ["bad_safety_constraint_count.json", /safety_constraint_count must be a non-negative integer/],
  ["source_strategy_dry_run_plan_id_mismatch.json", /source_strategy_dry_run_plan_id must match strategy_dry_run_plan_id/],
  ["source_strategy_definition_id_mismatch.json", /source_strategy_definition_id must match strategy_definition_id/],
  ["source_strategy_run_intent_id_mismatch.json", /source_strategy_run_intent_id must match strategy_run_intent_id/],
  ["source_strategy_run_manifest_id_mismatch.json", /source_strategy_run_manifest_id must match strategy_run_manifest_id/],
  ["source_strategy_run_evidence_bundle_id_mismatch.json", /source_strategy_run_evidence_bundle_id must match strategy_run_evidence_bundle_id/],
  ["validation_failed_with_ready_status.json", /ready StrategyDryRunPlanEvidenceSummary requires validation_passed/],
  ["forbidden_strategy_dry_run_summary_execution_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_summary_signal_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_summary_decision_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_summary_order_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_summary_recommendation_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_summary_bankroll_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_summary_credential_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/]
];

test("negative StrategyDryRunPlanEvidenceSummary fixtures fail deterministically", async () => {
  for (const [fixtureName, expectedError] of cases) {
    const report = await validateStrategyDryRunPlanEvidenceSummaryFile({
      filePath: path.join(negativeDir, fixtureName),
      repoRoot
    });

    assert.equal(report.ok, false, `${fixtureName} should fail validation`);
    assert.match(report.errors.join("\n"), expectedError, fixtureName);
  }
});
