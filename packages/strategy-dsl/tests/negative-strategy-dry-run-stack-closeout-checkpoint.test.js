import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateStrategyDryRunStackCloseoutCheckpointFile } from "../src/validate-strategy-dry-run-stack-closeout-checkpoint.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "negative");

const cases = [
  ["malformed_strategy_dry_run_stack_closeout_checkpoint.json", /Expected|Unexpected|JSON|position|end of JSON/i],
  ["bad_strategy_dry_run_stack_closeout_checkpoint_id.json", /strategy_dry_run_stack_closeout_checkpoint_id must be deterministic/],
  ["missing_strategy_dry_run_stack_closeout_provenance.json", /generated_at is required/],
  ["strategy_dry_run_stack_closeout_unsafe_live_execution_allowed.json", /live_execution_allowed must be false/],
  ["strategy_dry_run_stack_closeout_unsafe_order_placement_allowed.json", /order_placement_allowed must be false/],
  ["non_paper_only_strategy_dry_run_stack_closeout.json", /paper_only must be true/],
  ["invalid_strategy_dry_run_stack_closeout_replay_mode.json", /replay_mode is invalid/],
  ["invalid_strategy_dry_run_stack_closeout_run_mode.json", /run_mode is invalid/],
  ["invalid_strategy_dry_run_stack_closeout_status.json", /status is invalid/],
  ["invalid_strategy_dry_run_stack_closeout_readiness_status.json", /readiness_status is invalid/],
  ["invalid_strategy_dry_run_stack_closeout_consistency_status.json", /consistency_status is invalid/],
  ["invalid_strategy_dry_run_stack_closeout_freeze_recommendation.json", /freeze_recommendation is invalid/],
  ["missing_strategy_dry_run_stack_closeout_artifacts.json", /closeout_artifacts must be a non-empty array/],
  ["unknown_strategy_dry_run_stack_closeout_artifact.json", /closeout artifact_type is invalid/],
  ["duplicate_strategy_dry_run_stack_closeout_artifact.json", /duplicate closeout artifact_type is not allowed/],
  ["missing_required_strategy_dry_run_stack_closeout_artifact.json", /missing required closeout artifact_type/],
  ["missing_strategy_dry_run_stack_closeout_checks.json", /closeout_checks must be a non-empty array/],
  ["unknown_strategy_dry_run_stack_closeout_check.json", /closeout_check name is invalid/],
  ["invalid_strategy_dry_run_stack_closeout_check_status.json", /closeout_check status is invalid/],
  ["missing_required_strategy_dry_run_stack_closeout_check.json", /missing required closeout_check/],
  ["failed_check_with_stack_closeout_ready_status.json", /ready closeout checkpoints require all required closeout checks to pass|failed closeout checks require dry_run_stack_closeout_rejected status/],
  ["ready_status_with_not_ready_readiness.json", /ready closeout checkpoints require dry_run_ready readiness_status|dry_run_not_ready readiness_status requires dry_run_stack_closeout_rejected status/],
  ["ready_status_with_failed_consistency.json", /ready closeout checkpoints require consistency_passed|consistency_failed requires dry_run_stack_closeout_rejected status/],
  ["ready_status_with_freeze_not_ready.json", /ready closeout checkpoints require freeze_ready/],
  ["failed_check_with_freeze_ready.json", /failed closeout checks require freeze_not_ready/],
  ["source_strategy_definition_id_mismatch_closeout.json", /strategy_definition artifact_id must match source id/],
  ["source_strategy_run_intent_id_mismatch_closeout.json", /strategy_run_intent artifact_id must match source id/],
  ["source_strategy_run_manifest_id_mismatch_closeout.json", /strategy_run_manifest artifact_id must match source id/],
  ["source_strategy_run_evidence_bundle_id_mismatch_closeout.json", /strategy_run_evidence_bundle artifact_id must match source id/],
  ["source_strategy_dry_run_plan_id_mismatch_closeout.json", /strategy_dry_run_plan artifact_id must match source id/],
  ["source_strategy_dry_run_plan_evidence_summary_id_mismatch_closeout.json", /strategy_dry_run_plan_evidence_summary artifact_id must match source id/],
  ["source_strategy_dry_run_readiness_checkpoint_id_mismatch_closeout.json", /strategy_dry_run_readiness_checkpoint artifact_id must match source id/],
  ["source_strategy_dry_run_noop_summary_id_mismatch_closeout.json", /strategy_dry_run_noop_summary artifact_id must match source id/],
  ["source_strategy_dry_run_evidence_bundle_id_mismatch_closeout.json", /strategy_dry_run_evidence_bundle artifact_id must match source id/],
  ["source_strategy_dry_run_case_file_summary_id_mismatch_closeout.json", /strategy_dry_run_case_file_summary artifact_id must match source id/],
  ["unsafe_strategy_dry_run_stack_closeout_artifact_path.json", /closeout artifact_path artifact_path must not escape the repo/],
  ["forbidden_strategy_dry_run_stack_closeout_credential_path.json", /closeout artifact_path artifact_path must not reference credentials/],
  ["forbidden_strategy_dry_run_stack_closeout_execution_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_stack_closeout_signal_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_stack_closeout_decision_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_stack_closeout_order_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_stack_closeout_recommendation_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_stack_closeout_bankroll_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_stack_closeout_analytics_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/]
];

test("negative StrategyDryRunStackCloseoutCheckpoint fixtures fail deterministically", async () => {
  for (const [fixtureName, expectedError] of cases) {
    const report = await validateStrategyDryRunStackCloseoutCheckpointFile({
      filePath: path.join(negativeDir, fixtureName),
      repoRoot
    });

    assert.equal(report.ok, false, `${fixtureName} should fail validation`);
    assert.match(report.errors.join("\n"), expectedError, fixtureName);
  }
});
