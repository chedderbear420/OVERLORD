import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateStrategyDryRunTraceFile } from "../src/validate-strategy-dry-run-trace.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "negative");

const cases = [
  ["malformed_strategy_dry_run_trace.jsonl", /Expected|Unexpected|JSON|position|end of JSON/i],
  ["bad_strategy_dry_run_trace_id.jsonl", /strategy_dry_run_trace_id must be deterministic/],
  ["missing_strategy_dry_run_trace_provenance.jsonl", /generated_at is required/],
  ["strategy_dry_run_trace_unsafe_live_execution_allowed.jsonl", /live_execution_allowed must be false/],
  ["strategy_dry_run_trace_unsafe_order_placement_allowed.jsonl", /order_placement_allowed must be false/],
  ["non_paper_only_strategy_dry_run_trace.jsonl", /paper_only must be true/],
  ["invalid_strategy_dry_run_trace_event_type.jsonl", /trace_event_type is invalid/],
  ["invalid_strategy_dry_run_trace_status.jsonl", /status is invalid/],
  ["duplicate_strategy_dry_run_trace_index.jsonl", /trace_index values must be unique/],
  ["non_sequential_strategy_dry_run_trace_index.jsonl", /trace_index must be deterministic and contiguous/],
  ["missing_dry_run_started_trace.jsonl", /exactly one noop_dry_run_started|must start with noop_dry_run_started/],
  ["missing_dry_run_completed_trace.jsonl", /exactly one noop_dry_run_completed|must end with noop_dry_run_completed/],
  ["completed_before_started_dry_run_trace.jsonl", /must start with noop_dry_run_started|must end with noop_dry_run_completed|must come before/],
  ["invalid_planned_observation_step.jsonl", /metadata_only must be true|reads must be a non-empty array/],
  ["forbidden_dry_run_observation_step_execute_strategy.jsonl", /step_type is invalid|step_type is forbidden/],
  ["forbidden_dry_run_observation_step_generate_signal.jsonl", /step_type is invalid|step_type is forbidden/],
  ["forbidden_dry_run_observation_step_place_order.jsonl", /step_type is invalid|step_type is forbidden/],
  ["bad_observed_artifact_type.jsonl", /observed_artifact_type is invalid|observed_artifact_type must match first planned read/],
  ["forbidden_strategy_dry_run_trace_execution_field.jsonl", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_trace_signal_field.jsonl", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_trace_decision_field.jsonl", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_trace_order_field.jsonl", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_trace_recommendation_field.jsonl", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_trace_bankroll_field.jsonl", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_dry_run_trace_credential_field.jsonl", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/]
];

test("negative StrategyDryRunTrace fixtures fail deterministically", async () => {
  for (const [fixtureName, expectedError] of cases) {
    const report = await validateStrategyDryRunTraceFile({
      filePath: path.join(negativeDir, fixtureName)
    });

    assert.equal(report.ok, false, `${fixtureName} should fail validation`);
    assert.match(report.errors.join("\n"), expectedError, fixtureName);
  }
});
