import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateReplayRunManifestFile } from "../src/validate-replay-run-manifest.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "replay-engine", "fixtures", "negative");

const negativeFixtures = [
  ["malformed_replay_run_manifest.json", /Unexpected|JSON/],
  ["bad_replay_run_manifest_id.json", /replay_run_manifest_id must be deterministic/],
  ["missing_manifest_provenance.json", /generated_at is required/],
  ["manifest_unsafe_live_execution_allowed.json", /live_execution_allowed must be false/],
  ["manifest_unsafe_order_placement_allowed.json", /order_placement_allowed must be false/],
  ["non_paper_only_manifest.json", /paper_only must be true/],
  ["invalid_replay_mode.json", /replay_mode is invalid/],
  ["invalid_manifest_status.json", /status is invalid/],
  ["unsafe_repo_escape_path.json", /artifact_path must not escape the repo/],
  ["forbidden_credential_path.json", /artifact_path must not reference credentials/],
  ["missing_artifact_path.json", /artifact_path does not exist locally/],
  ["duplicate_artifact_reference.json", /duplicate artifact reference is not allowed/],
  ["bad_artifact_record_count.json", /artifact record_count must match local file count/],
  ["invalid_validation_command.json", /validation_command must be a local npm script|validation_commands must contain local npm scripts only/],
  ["forbidden_strategy_field.json", /forbidden strategy, bankroll, model, or recommendation field/],
  ["forbidden_bankroll_field.json", /forbidden strategy, bankroll, model, or recommendation field/],
  ["forbidden_recommendation_field.json", /forbidden strategy, bankroll, model, or recommendation field/]
];

for (const [fixtureName, expectedMessage] of negativeFixtures) {
  test(`${fixtureName} fails ReplayRunManifest validation deterministically`, async () => {
    const report = await validateReplayRunManifestFile({
      filePath: path.join(negativeDir, fixtureName),
      repoRoot
    });

    assert.equal(report.ok, false);
    assert.match(report.errors.join("\n"), expectedMessage);
  });
}
