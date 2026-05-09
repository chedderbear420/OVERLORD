import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateStrategyObservationNoOpSummaryFile } from "../src/validate-strategy-observation-noop-summary.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "negative");

const cases = [
  ["malformed_strategy_observation_noop_summary.json", /Expected|Unexpected|JSON|position|end of JSON/i],
  ["bad_strategy_observation_noop_summary_id.json", /strategy_observation_noop_summary_id must be deterministic/],
  ["missing_strategy_observation_noop_summary_provenance.json", /source_strategy_definition_id is required/],
  ["strategy_observation_noop_summary_unsafe_live_execution_allowed.json", /live_execution_allowed must be false/],
  ["strategy_observation_noop_summary_unsafe_order_placement_allowed.json", /order_placement_allowed must be false/],
  ["non_paper_only_strategy_observation_noop_summary.json", /paper_only must be true/],
  ["invalid_strategy_observation_noop_summary_status.json", /status is invalid/],
  ["bad_observation_total_trace_records.json", /total_trace_records must be a non-negative integer/],
  ["bad_observation_total_inputs_observed.json", /total_inputs_observed must be a non-negative integer/],
  ["bad_observation_summary_total_formula.json", /total_trace_records must equal total_inputs_observed plus start and completed trace records/],
  ["forbidden_strategy_observation_noop_summary_execution_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_noop_summary_signal_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_noop_summary_decision_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_noop_summary_order_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_noop_summary_recommendation_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_noop_summary_bankroll_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_noop_summary_analytics_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_noop_summary_credential_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/]
];

test("negative StrategyObservationNoOpSummary fixtures fail deterministically", async () => {
  for (const [fixtureName, expectedError] of cases) {
    const report = await validateStrategyObservationNoOpSummaryFile({
      filePath: path.join(negativeDir, fixtureName)
    });

    assert.equal(report.ok, false, `${fixtureName} should fail validation`);
    assert.match(report.errors.join("\n"), expectedError, fixtureName);
  }
});
