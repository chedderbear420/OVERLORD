import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateStrategyDryRunEvidenceBundleFile } from "../src/validate-strategy-dry-run-evidence-bundle.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "negative");

const cases = [
  ["malformed_strategy_dry_run_evidence_bundle.json", /Expected|Unexpected|JSON|position|end of JSON/i],
  ["bad_strategy_dry_run_evidence_bundle_id.json", /strategy_dry_run_evidence_bundle_id must be deterministic/],
  ["missing_strategy_dry_run_evidence_bundle_provenance.json", /generated_at is required/],
  ["strategy_dry_run_evidence_unsafe_live_execution_allowed.json", /live_execution_allowed must be false/],
  ["strategy_dry_run_evidence_unsafe_order_placement_allowed.json", /order_placement_allowed must be false/],
  ["non_paper_only_strategy_dry_run_evidence_bundle.json", /paper_only must be true/],
  ["invalid_strategy_dry_run_evidence_replay_mode.json", /replay_mode is invalid/],
  ["invalid_strategy_dry_run_evidence_run_mode.json", /run_mode is invalid/],
  ["invalid_strategy_dry_run_evidence_status.json", /status is invalid/],
  ["missing_strategy_dry_run_evidence_artifacts.json", /evidence_artifacts must be a non-empty array/],
  ["unknown_strategy_dry_run_evidence_artifact_type.json", /evidence artifact_type is invalid/],
  ["duplicate_strategy_dry_run_evidence_artifact_type.json", /duplicate evidence artifact_type is not allowed/],
  ["unsafe_strategy_dry_run_evidence_artifact_path.json", /artifact_path must be a relative repo path|must not escape the repo/i],
  ["forbidden_strategy_dry_run_evidence_credential_path.json", /credential|secret|api|live-config/i],
  ["bad_strategy_dry_run_evidence_record_count.json", /record_count must be a non-negative integer/],
  ["invalid_strategy_dry_run_evidence_validation_command.json", /validation_command must be a local npm script/],
  ["bad_strategy_dry_run_evidence_consistency_status.json", /consistency_check status is invalid/],
  ["missing_strategy_dry_run_evidence_required_consistency_check.json", /missing required consistency_check/],
  ["failed_strategy_dry_run_evidence_check_ready_status.json", /ready dry-run evidence bundles must not contain failed consistency checks/],
  ["not_applicable_strategy_dry_run_evidence_check_ready_status.json", /ready dry-run evidence bundles require all required consistency checks to pass/],
  ["forbidden_strategy_dry_run_evidence_execution_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_evidence_signal_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_evidence_decision_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_evidence_order_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_evidence_recommendation_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_evidence_bankroll_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_evidence_credential_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/]
];

test("negative StrategyDryRunEvidenceBundle fixtures fail deterministically", async () => {
  for (const [fixtureName, expectedError] of cases) {
    const report = await validateStrategyDryRunEvidenceBundleFile({
      filePath: path.join(negativeDir, fixtureName),
      repoRoot
    });

    assert.equal(report.ok, false, `${fixtureName} should fail validation`);
    assert.match(report.errors.join("\n"), expectedError, fixtureName);
  }
});
