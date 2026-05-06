import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateStrategyRunTraceFile } from "../src/validate-strategy-run-trace.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "negative");

const cases = [
  ["malformed_strategy_run_trace.jsonl", /Expected|Unexpected|JSON|position|end of JSON/i],
  ["bad_strategy_run_trace_id.jsonl", /strategy_run_trace_id must be deterministic/],
  ["missing_strategy_run_trace_provenance.jsonl", /generated_at is required/],
  ["strategy_trace_unsafe_live_execution_allowed.jsonl", /live_execution_allowed must be false/],
  ["strategy_trace_unsafe_order_placement_allowed.jsonl", /order_placement_allowed must be false/],
  ["non_paper_only_strategy_trace.jsonl", /paper_only must be true/],
  ["invalid_strategy_trace_event_type.jsonl", /trace_event_type is invalid/],
  ["invalid_strategy_trace_status.jsonl", /status is invalid/],
  ["duplicate_strategy_trace_index.jsonl", /trace_index values must be unique/],
  ["non_monotonic_strategy_trace_order.jsonl", /noop_strategy_input_observed traces must be in deterministic/],
  ["bad_strategy_trace_record_time.jsonl", /record_time must be a valid timestamp/],
  ["unsafe_strategy_trace_artifact_path.jsonl", /artifact_path artifact_path must not escape the repo/],
  ["forbidden_strategy_trace_execution_field.jsonl", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_trace_signal_field.jsonl", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_trace_decision_field.jsonl", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_trace_order_field.jsonl", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_trace_recommendation_field.jsonl", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/],
  ["forbidden_strategy_trace_bankroll_field.jsonl", /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/]
];

test("negative StrategyRunTrace fixtures fail deterministically", async () => {
  for (const [fixtureName, expectedError] of cases) {
    const report = await validateStrategyRunTraceFile({
      filePath: path.join(negativeDir, fixtureName),
      repoRoot
    });

    assert.equal(report.ok, false, `${fixtureName} should fail validation`);
    assert.match(report.errors.join("\n"), expectedError, fixtureName);
  }
});
