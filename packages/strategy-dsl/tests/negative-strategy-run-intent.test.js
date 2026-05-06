import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateStrategyRunIntentFile } from "../src/validate-strategy-run-intent.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "negative");

const cases = [
  ["malformed_strategy_run_intent.json", /Expected|Unexpected|JSON|position|end of JSON/i],
  ["bad_strategy_run_intent_id.json", /strategy_run_intent_id must be deterministic/],
  ["missing_strategy_run_intent_provenance.json", /created_at is required/],
  ["strategy_run_intent_unsafe_live_execution_allowed.json", /live_execution_allowed must be false/],
  ["strategy_run_intent_unsafe_order_placement_allowed.json", /order_placement_allowed must be false/],
  ["non_paper_only_strategy_run_intent.json", /paper_only must be true/],
  ["invalid_run_mode.json", /run_mode is invalid/],
  ["invalid_strategy_run_intent_status.json", /status is invalid/],
  ["invalid_replay_mode.json", /replay_mode is invalid/],
  ["missing_strategy_definition_reference.json", /strategy_definition_id is required/],
  ["bad_replay_evidence_bundle_reference.json", /source_replay_evidence_bundle_id must reference a ReplayEvidenceBundle id/],
  ["bad_replay_run_manifest_reference.json", /source_replay_run_manifest_id must reference a ReplayRunManifest id/],
  ["forbidden_intent_execution_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_intent_order_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_intent_decision_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_intent_recommendation_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_intent_bankroll_field.json", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/]
];

test("negative StrategyRunIntent fixtures fail deterministically", async () => {
  for (const [fixtureName, expectedError] of cases) {
    const report = await validateStrategyRunIntentFile({
      filePath: path.join(negativeDir, fixtureName)
    });

    assert.equal(report.ok, false, `${fixtureName} should fail validation`);
    assert.match(report.errors.join("\n"), expectedError, fixtureName);
  }
});
