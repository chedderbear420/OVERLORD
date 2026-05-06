import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateReplayNoopRunSummaryFile } from "../src/validate-replay-noop-run-summary.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "replay-engine", "fixtures", "negative");

const negativeFixtures = [
  ["malformed_replay_noop_run_summary.json", /Unexpected|JSON/],
  ["bad_replay_noop_run_summary_id.json", /replay_noop_run_summary_id must be deterministic/],
  ["missing_noop_summary_provenance.json", /source_replay_clock_id is required/],
  ["noop_summary_unsafe_live_execution_allowed.json", /live_execution_allowed must be false/],
  ["noop_summary_unsafe_order_placement_allowed.json", /order_placement_allowed must be false/],
  ["non_paper_only_noop_summary.json", /paper_only must be true/],
  ["invalid_noop_summary_mode.json", /replay_mode is invalid/],
  ["invalid_noop_summary_status.json", /status is invalid/],
  ["bad_noop_summary_total_trace_records.json", /ready no-op replay summaries must include start and completed trace records/],
  ["bad_noop_summary_total_records_read.json", /total_records_read must be a non-negative integer/],
  ["bad_noop_summary_artifact_total.json", /total_artifacts_read must not exceed total_records_read/],
  ["forbidden_noop_summary_strategy_field.json", /forbidden execution, strategy, bankroll, model, or recommendation field/]
];

for (const [fixtureName, expectedMessage] of negativeFixtures) {
  test(`${fixtureName} fails ReplayNoOpRunSummary validation deterministically`, async () => {
    const report = await validateReplayNoopRunSummaryFile({
      filePath: path.join(negativeDir, fixtureName),
      repoRoot
    });

    assert.equal(report.ok, false);
    assert.match(report.errors.join("\n"), expectedMessage);
  });
}
