import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateStrategyDryRunReadinessCheckpointFile } from "../src/validate-strategy-dry-run-readiness-checkpoint.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "negative");

const cases = [
  ["malformed_strategy_dry_run_readiness_checkpoint.json", /Expected|Unexpected|JSON|position|end of JSON/i],
  ["bad_strategy_dry_run_readiness_checkpoint_id.json", /strategy_dry_run_readiness_checkpoint_id must be deterministic/],
  ["missing_strategy_dry_run_readiness_checkpoint_provenance.json", /generated_at is required/],
  ["strategy_dry_run_readiness_unsafe_live_execution_allowed.json", /live_execution_allowed must be false/],
  ["strategy_dry_run_readiness_unsafe_order_placement_allowed.json", /order_placement_allowed must be false/],
  ["non_paper_only_strategy_dry_run_readiness.json", /paper_only must be true/],
  ["invalid_strategy_dry_run_readiness_replay_mode.json", /replay_mode is invalid/],
  ["invalid_strategy_dry_run_readiness_run_mode.json", /run_mode is invalid/],
  ["invalid_strategy_dry_run_readiness_status.json", /status is invalid/],
  ["invalid_strategy_dry_run_readiness_readiness_status.json", /readiness_status is invalid/],
  ["missing_prerequisite_artifacts.json", /prerequisite_artifacts must be a non-empty array/],
  ["unknown_prerequisite_artifact.json", /prerequisite_artifact artifact_type is invalid/],
  ["duplicate_prerequisite_artifact.json", /duplicate prerequisite_artifact artifact_type is not allowed/],
  ["missing_required_readiness_check.json", /readiness_checks must include no_live_connectivity_detected/],
  ["unknown_readiness_check.json", /readiness_check check_name is invalid/],
  ["invalid_readiness_check_status.json", /readiness_check status is invalid/],
  ["failed_check_with_ready_readiness_status.json", /dry_run_ready requires all required readiness checks to pass/],
  ["ready_status_with_not_ready_readiness_status.json", /dry_run_readiness_checkpoint_ready requires dry_run_ready readiness_status/],
  ["source_strategy_definition_id_mismatch_readiness.json", /source_strategy_definition_id must match strategy_definition_id/],
  ["source_strategy_run_intent_id_mismatch_readiness.json", /source_strategy_run_intent_id must match strategy_run_intent_id/],
  ["source_strategy_run_manifest_id_mismatch_readiness.json", /source_strategy_run_manifest_id must match strategy_run_manifest_id/],
  ["source_strategy_run_evidence_bundle_id_mismatch_readiness.json", /source_strategy_run_evidence_bundle_id must match strategy_run_evidence_bundle_id/],
  ["source_strategy_dry_run_plan_id_mismatch_readiness.json", /source_strategy_dry_run_plan_id must match strategy_dry_run_plan_id/],
  ["source_strategy_dry_run_plan_evidence_summary_id_mismatch_readiness.json", /source_strategy_dry_run_plan_evidence_summary_id must match strategy_dry_run_plan_evidence_summary_id/],
  ["unsafe_strategy_dry_run_readiness_artifact_path.json", /prerequisite_artifact artifact_path artifact_path must not escape the repo/],
  ["forbidden_strategy_dry_run_readiness_credential_path.json", /prerequisite_artifact artifact_path artifact_path must not reference credentials/],
  ["forbidden_strategy_dry_run_readiness_execution_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_readiness_signal_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_readiness_decision_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_readiness_order_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_readiness_recommendation_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_readiness_bankroll_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_readiness_analytics_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/]
];

test("negative StrategyDryRunReadinessCheckpoint fixtures fail deterministically", async () => {
  for (const [fixtureName, expectedError] of cases) {
    const report = await validateStrategyDryRunReadinessCheckpointFile({
      filePath: path.join(negativeDir, fixtureName),
      repoRoot
    });

    assert.equal(report.ok, false, `${fixtureName} should fail validation`);
    assert.match(report.errors.join("\n"), expectedError, fixtureName);
  }
});
