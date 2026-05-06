import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateReplayReadPlanFile } from "../src/validate-replay-read-plan.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "replay-engine", "fixtures", "negative");

const negativeFixtures = [
  ["malformed_replay_read_plan.json", /Unexpected|JSON/],
  ["bad_replay_read_plan_id.json", /replay_read_plan_id must be deterministic/],
  ["missing_replay_read_plan_provenance.json", /source_replay_run_manifest_id is required/],
  ["replay_read_plan_unsafe_live_execution_allowed.json", /live_execution_allowed must be false/],
  ["replay_read_plan_unsafe_order_placement_allowed.json", /order_placement_allowed must be false/],
  ["non_paper_only_replay_read_plan.json", /paper_only must be true/],
  ["invalid_replay_read_plan_mode.json", /replay_mode is invalid/],
  ["invalid_replay_read_plan_status.json", /status is invalid/],
  ["missing_artifact_reads.json", /artifact_reads must be a non-empty array/],
  ["duplicate_artifact_read_index.json", /read_index values must be unique/],
  ["bad_total_records_planned.json", /total_records_planned must equal/],
  ["unsafe_read_plan_artifact_path.json", /artifact_path artifact_path must not reference credentials/],
  ["forbidden_read_plan_strategy_field.json", /forbidden execution, strategy, bankroll, model, or recommendation field/],
  ["forbidden_read_plan_bankroll_field.json", /forbidden execution, strategy, bankroll, model, or recommendation field/],
  ["forbidden_read_plan_recommendation_field.json", /forbidden execution, strategy, bankroll, model, or recommendation field/]
];

for (const [fixtureName, expectedMessage] of negativeFixtures) {
  test(`${fixtureName} fails ReplayReadPlan validation deterministically`, async () => {
    const report = await validateReplayReadPlanFile({
      filePath: path.join(negativeDir, fixtureName),
      repoRoot
    });

    assert.equal(report.ok, false);
    assert.match(report.errors.join("\n"), expectedMessage);
  });
}
