import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateReplayRunReportFile } from "../src/validate-replay-run-report.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "replay-engine", "fixtures", "negative");

const negativeFixtures = [
  ["malformed_replay_run_report.json", /Unexpected|JSON/],
  ["bad_replay_run_report_id.json", /replay_run_report_id must be deterministic/],
  ["missing_replay_run_report_provenance.json", /source_replay_evidence_bundle_id is required/],
  ["run_report_unsafe_live_execution_allowed.json", /live_execution_allowed must be false/],
  ["run_report_unsafe_order_placement_allowed.json", /order_placement_allowed must be false/],
  ["non_paper_only_run_report.json", /paper_only must be true/],
  ["invalid_run_report_mode.json", /replay_mode is invalid/],
  ["invalid_run_report_status.json", /status is invalid/],
  ["bad_total_artifacts_verified.json", /total_artifacts_verified must match the local no-op replay evidence fixture/],
  ["bad_total_trace_records_report.json", /total_trace_records must match the local no-op replay evidence fixture/],
  ["bad_total_records_read_report.json", /total_records_read must be a non-negative integer/],
  ["bad_total_artifacts_read_report.json", /total_artifacts_read must match the local no-op replay evidence fixture/],
  ["invalid_consistency_status.json", /consistency_status is invalid/],
  ["inconsistent_ready_report_with_failed_consistency.json", /non-passed replay reports must use replay_run_report_rejected status/],
  ["forbidden_report_execution_field.json", /forbidden execution, strategy, bankroll, model, or recommendation field/],
  ["forbidden_report_strategy_field.json", /forbidden execution, strategy, bankroll, model, or recommendation field/],
  ["forbidden_report_bankroll_field.json", /forbidden execution, strategy, bankroll, model, or recommendation field/],
  ["forbidden_report_recommendation_field.json", /forbidden execution, strategy, bankroll, model, or recommendation field/]
];

for (const [fixtureName, expectedMessage] of negativeFixtures) {
  test(`${fixtureName} fails ReplayRunReport validation deterministically`, async () => {
    const report = await validateReplayRunReportFile({
      filePath: path.join(negativeDir, fixtureName),
      repoRoot
    });

    assert.equal(report.ok, false);
    assert.match(report.errors.join("\n"), expectedMessage);
  });
}
