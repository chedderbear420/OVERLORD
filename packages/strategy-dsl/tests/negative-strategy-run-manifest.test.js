import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateStrategyRunManifestFile } from "../src/validate-strategy-run-manifest.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "negative");

const cases = [
  ["malformed_strategy_run_manifest.json", /Expected|Unexpected|JSON|position|end of JSON/i],
  ["bad_strategy_run_manifest_id.json", /strategy_run_manifest_id must be deterministic/],
  ["missing_strategy_run_manifest_provenance.json", /generated_at is required/],
  ["strategy_run_manifest_unsafe_live_execution_allowed.json", /live_execution_allowed must be false/],
  ["strategy_run_manifest_unsafe_order_placement_allowed.json", /order_placement_allowed must be false/],
  ["non_paper_only_strategy_run_manifest.json", /paper_only must be true/],
  ["invalid_strategy_run_manifest_replay_mode.json", /replay_mode is invalid/],
  ["invalid_strategy_run_manifest_run_mode.json", /run_mode is invalid/],
  ["invalid_strategy_run_manifest_status.json", /status is invalid/],
  ["missing_strategy_run_manifest_artifacts.json", /artifacts must be a non-empty array/],
  ["unknown_strategy_run_manifest_artifact_type.json", /artifact_type is invalid/],
  ["duplicate_strategy_run_manifest_artifact_type.json", /duplicate artifact_type is not allowed/],
  ["unsafe_strategy_run_manifest_artifact_path.json", /artifact_path artifact_path must not escape the repo/],
  ["forbidden_strategy_run_manifest_credential_path.json", /artifact_path artifact_path must not reference credentials/],
  ["missing_strategy_run_manifest_artifact_path.json", /artifact artifact_path is required/],
  ["bad_strategy_run_manifest_record_count.json", /artifact record_count must match local fixture count/],
  ["invalid_strategy_run_manifest_validation_command.json", /local npm script/],
  ["forbidden_strategy_run_manifest_execution_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_run_manifest_signal_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_run_manifest_decision_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_run_manifest_order_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_run_manifest_recommendation_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_run_manifest_bankroll_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/]
];

test("negative StrategyRunManifest fixtures fail deterministically", async () => {
  for (const [fixtureName, expectedError] of cases) {
    const report = await validateStrategyRunManifestFile({
      filePath: path.join(negativeDir, fixtureName),
      repoRoot
    });

    assert.equal(report.ok, false, `${fixtureName} should fail validation`);
    assert.match(report.errors.join("\n"), expectedError, fixtureName);
  }
});
