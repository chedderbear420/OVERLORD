import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateStrategyObservationTraceFile } from "../src/validate-strategy-observation-trace.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "negative");

const cases = [
  ["malformed_strategy_observation_trace.jsonl", /Expected|Unexpected|JSON|position|end of JSON/i],
  ["bad_strategy_observation_trace_id.jsonl", /strategy_observation_trace_id must be deterministic/],
  ["missing_strategy_observation_trace_provenance.jsonl", /source_strategy_definition_id is required/],
  ["strategy_observation_trace_unsafe_live_execution_allowed.jsonl", /live_execution_allowed must be false/],
  ["strategy_observation_trace_unsafe_order_placement_allowed.jsonl", /order_placement_allowed must be false/],
  ["non_paper_only_strategy_observation_trace.jsonl", /paper_only must be true/],
  ["invalid_strategy_observation_trace_event_type.jsonl", /trace_event_type is invalid/],
  ["invalid_strategy_observation_trace_status.jsonl", /status is invalid/],
  ["duplicate_strategy_observation_trace_index.jsonl", /trace_index values must be unique|trace_index must be deterministic and contiguous/],
  ["non_sequential_strategy_observation_trace_index.jsonl", /trace_index must be deterministic and contiguous/],
  ["missing_observation_started_trace.jsonl", /exactly one noop_observation_started|must start with noop_observation_started/],
  ["missing_observation_completed_trace.jsonl", /exactly one noop_observation_completed|must end with noop_observation_completed/],
  ["completed_before_started_observation_trace.jsonl", /must start with noop_observation_started|must end with noop_observation_completed|middle records must be noop_observation_input_seen/],
  ["bad_observed_input_type.jsonl", /observed_input_type is invalid/],
  ["bad_observed_record_count.jsonl", /observed_record_count must be a non-negative integer/],
  ["unsafe_observation_trace_artifact_path.jsonl", /observed_artifact_path artifact_path must not escape the repo/],
  ["forbidden_observation_trace_credential_path.jsonl", /observed_artifact_path artifact_path must not reference credentials/],
  ["forbidden_strategy_observation_trace_execution_field.jsonl", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_trace_signal_field.jsonl", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_trace_decision_field.jsonl", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_trace_order_field.jsonl", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_trace_recommendation_field.jsonl", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_trace_bankroll_field.jsonl", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_trace_analytics_field.jsonl", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_observation_trace_credential_field.jsonl", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/]
];

test("negative StrategyObservationTrace fixtures fail deterministically", async () => {
  for (const [fixtureName, expectedError] of cases) {
    const report = await validateStrategyObservationTraceFile({
      filePath: path.join(negativeDir, fixtureName),
      repoRoot
    });

    assert.equal(report.ok, false, `${fixtureName} should fail validation`);
    assert.match(report.errors.join("\n"), expectedError, fixtureName);
  }
});
