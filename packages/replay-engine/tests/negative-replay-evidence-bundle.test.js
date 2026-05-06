import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateReplayEvidenceBundleFile } from "../src/validate-replay-evidence-bundle.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "replay-engine", "fixtures", "negative");

const negativeFixtures = [
  ["malformed_replay_evidence_bundle.json", /Unexpected|JSON/],
  ["bad_replay_evidence_bundle_id.json", /replay_evidence_bundle_id must be deterministic/],
  ["missing_replay_evidence_bundle_provenance.json", /source_replay_clock_id is required/],
  ["evidence_bundle_unsafe_live_execution_allowed.json", /live_execution_allowed must be false/],
  ["evidence_bundle_unsafe_order_placement_allowed.json", /order_placement_allowed must be false/],
  ["non_paper_only_evidence_bundle.json", /paper_only must be true/],
  ["invalid_evidence_bundle_mode.json", /replay_mode is invalid/],
  ["invalid_evidence_bundle_status.json", /status is invalid/],
  ["missing_evidence_artifacts.json", /evidence_artifacts must be a non-empty array/],
  ["unknown_evidence_artifact_type.json", /evidence artifact_type is invalid/],
  ["duplicate_evidence_artifact_type.json", /duplicate evidence artifact_type is not allowed/],
  ["unsafe_evidence_artifact_path.json", /must not escape the repo/],
  ["forbidden_evidence_credential_path.json", /must not reference credentials/],
  ["bad_consistency_check_status.json", /consistency_check status is invalid/],
  ["missing_required_consistency_check.json", /missing required consistency_check: trace_count_matches_summary/],
  ["failed_consistency_check_ready_status.json", /ready evidence bundles must not contain failed consistency checks/],
  ["forbidden_evidence_execution_field.json", /forbidden execution, strategy, bankroll, model, or recommendation field/],
  ["forbidden_evidence_strategy_field.json", /forbidden execution, strategy, bankroll, model, or recommendation field/],
  ["forbidden_evidence_bankroll_field.json", /forbidden execution, strategy, bankroll, model, or recommendation field/],
  ["forbidden_evidence_recommendation_field.json", /forbidden execution, strategy, bankroll, model, or recommendation field/]
];

for (const [fixtureName, expectedMessage] of negativeFixtures) {
  test(`${fixtureName} fails ReplayEvidenceBundle validation deterministically`, async () => {
    const report = await validateReplayEvidenceBundleFile({
      filePath: path.join(negativeDir, fixtureName),
      repoRoot
    });

    assert.equal(report.ok, false);
    assert.match(report.errors.join("\n"), expectedMessage);
  });
}
