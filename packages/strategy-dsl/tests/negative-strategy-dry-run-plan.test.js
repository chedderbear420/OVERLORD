import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateStrategyDryRunPlanFile } from "../src/validate-strategy-dry-run-plan.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "negative");

const cases = [
  ["malformed_strategy_dry_run_plan.json", /Expected|Unexpected|JSON|position|end of JSON/i],
  ["bad_strategy_dry_run_plan_id.json", /strategy_dry_run_plan_id must be deterministic/],
  ["missing_strategy_dry_run_plan_provenance.json", /generated_at is required/],
  ["strategy_dry_run_plan_unsafe_live_execution_allowed.json", /live_execution_allowed must be false/],
  ["strategy_dry_run_plan_unsafe_order_placement_allowed.json", /order_placement_allowed must be false/],
  ["non_paper_only_strategy_dry_run_plan.json", /paper_only must be true/],
  ["invalid_strategy_dry_run_plan_replay_mode.json", /replay_mode is invalid/],
  ["invalid_strategy_dry_run_plan_run_mode.json", /run_mode is invalid/],
  ["invalid_strategy_dry_run_plan_status.json", /status is invalid/],
  ["bad_strategy_dry_run_plan_source_id.json", /source_strategy_definition_id must match strategy_definition_id/],
  ["missing_strategy_dry_run_allowed_inputs.json", /allowed_input_artifacts must be a non-empty array/],
  ["invalid_strategy_dry_run_allowed_input.json", /allowed_input artifact_type is invalid/],
  ["duplicate_strategy_dry_run_allowed_input.json", /duplicate allowed_input artifact_type is not allowed/],
  ["unsafe_strategy_dry_run_artifact_path.json", /allowed_input artifact_path artifact_path must not escape the repo/],
  ["forbidden_strategy_dry_run_credential_path.json", /allowed_input artifact_path artifact_path must not reference credentials/],
  ["strategy_dry_run_non_read_only_input.json", /allowed_input access_mode must be read_only/],
  ["missing_strategy_dry_run_forbidden_output.json", /forbidden_outputs must include edge_signal/],
  ["empty_strategy_dry_run_forbidden_outputs.json", /forbidden_outputs must be a non-empty array/],
  ["forbidden_strategy_dry_run_step_type.json", /planned_observation_step step_type is invalid/],
  ["duplicate_strategy_dry_run_step_index.json", /planned_observation_step indexes must be unique/],
  ["non_sequential_strategy_dry_run_step_index.json", /planned_observation_step indexes must be sequential/],
  ["strategy_dry_run_step_not_metadata_only.json", /planned_observation_step metadata_only must be true/],
  ["strategy_dry_run_invalid_step_read.json", /planned_observation_step reads contains invalid artifact type/],
  ["missing_strategy_dry_run_safety_constraint.json", /safety_constraints must include no_network/],
  ["empty_strategy_dry_run_safety_constraints.json", /safety_constraints must be a non-empty array/],
  ["forbidden_strategy_dry_run_execution_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_signal_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_decision_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_order_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_recommendation_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_bankroll_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/]
];

test("negative StrategyDryRunPlan fixtures fail deterministically", async () => {
  for (const [fixtureName, expectedError] of cases) {
    const report = await validateStrategyDryRunPlanFile({
      filePath: path.join(negativeDir, fixtureName),
      repoRoot
    });

    assert.equal(report.ok, false, `${fixtureName} should fail validation`);
    assert.match(report.errors.join("\n"), expectedError, fixtureName);
  }
});
