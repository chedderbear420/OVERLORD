import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateStrategyObservationInputSetFile } from "../src/validate-strategy-observation-input-set.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "negative");

const cases = [
  ["malformed_strategy_observation_input_set.json", /Expected|Unexpected|JSON|position|end of JSON/i],
  ["bad_strategy_observation_input_set_id.json", /strategy_observation_input_set_id must be deterministic/],
  ["missing_strategy_observation_input_set_provenance.json", /source_strategy_definition_id is required/],
  ["strategy_observation_input_set_unsafe_live_execution_allowed.json", /live_execution_allowed must be false/],
  ["strategy_observation_input_set_unsafe_order_placement_allowed.json", /order_placement_allowed must be false/],
  ["non_paper_only_strategy_observation_input_set.json", /paper_only must be true/],
  ["invalid_strategy_observation_input_set_replay_mode.json", /replay_mode is invalid/],
  ["invalid_strategy_observation_input_set_run_mode.json", /run_mode is invalid/],
  ["invalid_strategy_observation_input_set_status.json", /status is invalid/],
  ["missing_strategy_observation_input_artifacts.json", /input_artifacts must be a non-empty array/],
  ["unknown_strategy_observation_input_artifact_type.json", /input_artifact artifact_type is invalid/],
  ["duplicate_strategy_observation_input_artifact_type.json", /duplicate input_artifact artifact_type is not allowed/],
  ["bad_strategy_observation_input_record_count.json", /input_artifact record_count must be a non-negative integer/],
  ["unsafe_strategy_observation_input_artifact_path.json", /input_artifact artifact_path artifact_path must not escape the repo/],
  ["forbidden_strategy_observation_input_credential_path.json", /input_artifact artifact_path artifact_path must not reference credentials/],
  ["forbidden_strategy_observation_input_execution_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_input_signal_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_input_decision_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_input_order_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_input_recommendation_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_input_bankroll_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_input_analytics_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/]
];

test("negative StrategyObservationInputSet fixtures fail deterministically", async () => {
  for (const [fixtureName, expectedError] of cases) {
    const report = await validateStrategyObservationInputSetFile({
      filePath: path.join(negativeDir, fixtureName),
      repoRoot
    });

    assert.equal(report.ok, false, `${fixtureName} should fail validation`);
    assert.match(report.errors.join("\n"), expectedError, fixtureName);
  }
});
