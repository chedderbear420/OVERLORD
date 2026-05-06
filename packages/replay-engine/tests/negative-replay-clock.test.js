import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateReplayClockFile } from "../src/validate-replay-clock.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "replay-engine", "fixtures", "negative");

const negativeFixtures = [
  ["malformed_replay_clock.json", /Unexpected|JSON/],
  ["bad_replay_clock_id.json", /replay_clock_id must be deterministic/],
  ["missing_replay_clock_provenance.json", /source_replay_run_manifest_id is required/],
  ["replay_clock_unsafe_live_execution_allowed.json", /live_execution_allowed must be false/],
  ["replay_clock_unsafe_order_placement_allowed.json", /order_placement_allowed must be false/],
  ["non_paper_only_replay_clock.json", /paper_only must be true/],
  ["invalid_replay_clock_mode.json", /replay_mode is invalid/],
  ["invalid_replay_clock_status.json", /status is invalid/],
  ["missing_clock_events.json", /clock_events must be a non-empty array/],
  ["non_monotonic_clock_events.json", /clock_events must be sorted/],
  ["duplicate_clock_event_index.json", /clock_index values must be unique/],
  ["bad_clock_record_time.json", /record_time must be a valid timestamp/],
  ["unsafe_clock_artifact_path.json", /artifact_path artifact_path must not escape the repo/],
  ["forbidden_clock_execution_field.json", /forbidden execution, strategy, bankroll, model, or recommendation field/]
];

for (const [fixtureName, expectedMessage] of negativeFixtures) {
  test(`${fixtureName} fails ReplayClock validation deterministically`, async () => {
    const report = await validateReplayClockFile({
      filePath: path.join(negativeDir, fixtureName),
      repoRoot
    });

    assert.equal(report.ok, false);
    assert.match(report.errors.join("\n"), expectedMessage);
  });
}
