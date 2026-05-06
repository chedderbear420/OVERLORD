import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateStrategyRunEvidenceBundleFile } from "../src/validate-strategy-run-evidence-bundle.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "negative");

const cases = [
  ["malformed_strategy_run_evidence_bundle.json", /Expected|Unexpected|JSON|position|end of JSON/i],
  ["bad_strategy_run_evidence_bundle_id.json", /strategy_run_evidence_bundle_id must be deterministic/],
  ["missing_strategy_run_evidence_bundle_provenance.json", /generated_at is required/],
  ["strategy_run_evidence_unsafe_live_execution_allowed.json", /live_execution_allowed must be false/],
  ["strategy_run_evidence_unsafe_order_placement_allowed.json", /order_placement_allowed must be false/],
  ["non_paper_only_strategy_run_evidence_bundle.json", /paper_only must be true/],
  ["invalid_strategy_run_evidence_replay_mode.json", /replay_mode is invalid/],
  ["invalid_strategy_run_evidence_run_mode.json", /run_mode is invalid/],
  ["invalid_strategy_run_evidence_status.json", /status is invalid/],
  ["missing_strategy_run_evidence_artifacts.json", /evidence_artifacts must be a non-empty array/],
  ["unknown_strategy_run_evidence_artifact_type.json", /evidence artifact_type is invalid/],
  ["duplicate_strategy_run_evidence_artifact_type.json", /duplicate evidence artifact_type is not allowed/],
  ["unsafe_strategy_run_evidence_artifact_path.json", /evidence artifact_path artifact_path must not escape the repo/],
  ["forbidden_strategy_run_evidence_credential_path.json", /evidence artifact_path artifact_path must not reference credentials/],
  ["bad_strategy_run_evidence_consistency_status.json", /consistency_check status is invalid/],
  ["missing_strategy_run_evidence_required_consistency_check.json", /missing required consistency_check: trace_totals/],
  ["failed_strategy_run_evidence_check_ready_status.json", /ready strategy run evidence bundles must not contain failed consistency checks/],
  ["forbidden_strategy_run_evidence_execution_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_run_evidence_signal_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_run_evidence_decision_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_run_evidence_order_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_run_evidence_recommendation_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_run_evidence_bankroll_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/]
];

test("negative StrategyRunEvidenceBundle fixtures fail deterministically", async () => {
  for (const [fixtureName, expectedError] of cases) {
    const report = await validateStrategyRunEvidenceBundleFile({
      filePath: path.join(negativeDir, fixtureName),
      repoRoot
    });

    assert.equal(report.ok, false, `${fixtureName} should fail validation`);
    assert.match(report.errors.join("\n"), expectedError, fixtureName);
  }
});
