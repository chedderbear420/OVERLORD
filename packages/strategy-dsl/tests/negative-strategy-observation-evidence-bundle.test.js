import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateStrategyObservationEvidenceBundleFile } from "../src/validate-strategy-observation-evidence-bundle.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "negative");
const negativeFixtures = [
  "malformed_strategy_observation_evidence_bundle.json",
  "bad_strategy_observation_evidence_bundle_id.json",
  "missing_strategy_observation_evidence_bundle_provenance.json",
  "strategy_observation_evidence_unsafe_live_execution_allowed.json",
  "strategy_observation_evidence_unsafe_order_placement_allowed.json",
  "non_paper_only_strategy_observation_evidence_bundle.json",
  "invalid_strategy_observation_evidence_replay_mode.json",
  "invalid_strategy_observation_evidence_run_mode.json",
  "invalid_strategy_observation_evidence_status.json",
  "missing_strategy_observation_evidence_artifacts.json",
  "unknown_strategy_observation_evidence_artifact_type.json",
  "duplicate_strategy_observation_evidence_artifact_type.json",
  "missing_required_strategy_observation_evidence_artifact.json",
  "unsafe_strategy_observation_evidence_artifact_path.json",
  "forbidden_strategy_observation_evidence_credential_path.json",
  "bad_strategy_observation_evidence_consistency_status.json",
  "missing_strategy_observation_required_consistency_check.json",
  "failed_strategy_observation_evidence_check_ready_status.json",
  "source_strategy_observation_contract_id_mismatch_evidence.json",
  "source_strategy_observation_input_set_id_mismatch_evidence.json",
  "source_strategy_observation_noop_summary_id_mismatch_evidence.json",
  "forbidden_strategy_observation_evidence_execution_field.json",
  "forbidden_strategy_observation_evidence_signal_field.json",
  "forbidden_strategy_observation_evidence_decision_field.json",
  "forbidden_strategy_observation_evidence_order_field.json",
  "forbidden_strategy_observation_evidence_recommendation_field.json",
  "forbidden_strategy_observation_evidence_bankroll_field.json",
  "forbidden_strategy_observation_evidence_analytics_field.json",
  "forbidden_strategy_observation_evidence_credential_field.json"
];

test("negative StrategyObservationEvidenceBundle fixtures fail deterministically", async () => {
  for (const fixture of negativeFixtures) {
    const report = await validateStrategyObservationEvidenceBundleFile({
      filePath: path.join(negativeDir, fixture),
      repoRoot
    });

    assert.equal(report.ok, false, `${fixture} should fail validation`);
    assert.ok(report.errors.length > 0, `${fixture} should report at least one error`);
  }
});
