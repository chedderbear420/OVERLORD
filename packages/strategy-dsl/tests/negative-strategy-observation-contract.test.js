import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateStrategyObservationContractFile } from "../src/validate-strategy-observation-contract.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "negative");

const cases = [
  ["malformed_strategy_observation_contract.json", /Expected|Unexpected|JSON|position|end of JSON/i],
  ["bad_strategy_observation_contract_id.json", /strategy_observation_contract_id must be deterministic/],
  ["missing_strategy_observation_contract_provenance.json", /source_strategy_definition_id is required/],
  ["strategy_observation_contract_unsafe_live_execution_allowed.json", /live_execution_allowed must be false/],
  ["strategy_observation_contract_unsafe_order_placement_allowed.json", /order_placement_allowed must be false/],
  ["non_paper_only_strategy_observation_contract.json", /paper_only must be true/],
  ["invalid_strategy_observation_contract_replay_mode.json", /replay_mode is invalid/],
  ["invalid_strategy_observation_contract_run_mode.json", /run_mode is invalid/],
  ["invalid_strategy_observation_contract_status.json", /status is invalid/],
  ["missing_allowed_observation_inputs.json", /allowed_observation_inputs must be a non-empty array/],
  ["unknown_allowed_observation_input.json", /allowed_observation_inputs contains invalid input/],
  ["duplicate_allowed_observation_input.json", /duplicate allowed_observation_inputs are not allowed/],
  ["missing_required_forbidden_observation_output.json", /forbidden_observation_outputs must include edge_signal/],
  ["missing_observation_rules.json", /observation_rules must be a non-empty array/],
  ["unknown_observation_rule.json", /observation_rules contains invalid rule/],
  ["forbidden_observation_rule_execute_strategy.json", /observation_rules contains invalid rule/],
  ["forbidden_observation_rule_generate_signal.json", /observation_rules contains invalid rule/],
  ["forbidden_observation_rule_generate_decision.json", /observation_rules contains invalid rule/],
  ["forbidden_observation_rule_place_order.json", /observation_rules contains invalid rule/],
  ["forbidden_observation_rule_recommend_trade.json", /observation_rules contains invalid rule/],
  ["forbidden_strategy_observation_contract_execution_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_contract_signal_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_contract_decision_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_contract_order_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_contract_recommendation_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_contract_bankroll_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_contract_analytics_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_contract_credential_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/]
];

test("negative StrategyObservationContract fixtures fail deterministically", async () => {
  for (const [fixtureName, expectedError] of cases) {
    const report = await validateStrategyObservationContractFile({
      filePath: path.join(negativeDir, fixtureName)
    });

    assert.equal(report.ok, false, `${fixtureName} should fail validation`);
    assert.match(report.errors.join("\n"), expectedError, fixtureName);
  }
});
