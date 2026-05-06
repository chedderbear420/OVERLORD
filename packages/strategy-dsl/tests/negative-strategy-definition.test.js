import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateStrategyDefinitionFile } from "../src/validate-strategy-definition.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "negative");

const cases = [
  ["malformed_strategy_definition.json", /Expected|Unexpected|JSON|position|end of JSON/i],
  ["bad_strategy_definition_id.json", /strategy_definition_id must be deterministic/],
  ["missing_strategy_definition_provenance.json", /created_at is required/],
  ["strategy_definition_unsafe_live_execution_allowed.json", /live_execution_allowed must be false/],
  ["strategy_definition_unsafe_order_placement_allowed.json", /order_placement_allowed must be false/],
  ["non_paper_only_strategy_definition.json", /paper_only must be true/],
  ["invalid_strategy_type.json", /strategy_type is invalid/],
  ["invalid_strategy_definition_status.json", /status is invalid/],
  ["invalid_allowed_input.json", /allowed_inputs may reference existing artifact categories only/],
  ["missing_required_forbidden_output.json", /forbidden_outputs must include all required/],
  ["forbidden_strategy_executable_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_network_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_credential_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_order_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_recommendation_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_bankroll_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/]
];

test("negative StrategyDefinition fixtures fail deterministically", async () => {
  for (const [fixtureName, expectedError] of cases) {
    const report = await validateStrategyDefinitionFile({
      filePath: path.join(negativeDir, fixtureName)
    });

    assert.equal(report.ok, false, `${fixtureName} should fail validation`);
    assert.match(report.errors.join("\n"), expectedError, fixtureName);
  }
});
