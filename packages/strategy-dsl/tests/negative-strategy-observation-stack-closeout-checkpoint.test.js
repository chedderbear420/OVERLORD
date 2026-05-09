import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateStrategyObservationStackCloseoutCheckpointFile } from "../src/validate-strategy-observation-stack-closeout-checkpoint.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "negative");
const negativeFixtures = [
  "malformed_strategy_observation_stack_closeout_checkpoint.json",
  "bad_strategy_observation_stack_closeout_checkpoint_id.json",
  "missing_strategy_observation_stack_closeout_provenance.json",
  "strategy_observation_stack_closeout_unsafe_live_execution_allowed.json",
  "strategy_observation_stack_closeout_unsafe_order_placement_allowed.json",
  "non_paper_only_strategy_observation_stack_closeout.json",
  "invalid_strategy_observation_stack_closeout_replay_mode.json",
  "invalid_strategy_observation_stack_closeout_run_mode.json",
  "invalid_strategy_observation_stack_closeout_status.json",
  "invalid_strategy_observation_stack_closeout_consistency_status.json",
  "invalid_strategy_observation_stack_closeout_freeze_recommendation.json",
  "missing_strategy_observation_stack_closeout_artifacts.json",
  "unknown_strategy_observation_stack_closeout_artifact.json",
  "duplicate_strategy_observation_stack_closeout_artifact.json",
  "missing_required_strategy_observation_stack_closeout_artifact.json",
  "missing_strategy_observation_stack_closeout_checks.json",
  "unknown_strategy_observation_stack_closeout_check.json",
  "invalid_strategy_observation_stack_closeout_check_status.json",
  "missing_required_strategy_observation_stack_closeout_check.json",
  "failed_check_with_observation_stack_closeout_ready_status.json",
  "ready_status_with_failed_observation_consistency.json",
  "ready_status_with_observation_freeze_not_ready.json",
  "failed_check_with_observation_freeze_ready.json",
  "source_strategy_observation_contract_id_mismatch_closeout.json",
  "source_strategy_observation_input_set_id_mismatch_closeout.json",
  "source_strategy_observation_noop_summary_id_mismatch_closeout.json",
  "source_strategy_observation_evidence_bundle_id_mismatch_closeout.json",
  "source_strategy_observation_case_file_summary_id_mismatch_closeout.json",
  "source_strategy_dry_run_stack_closeout_checkpoint_id_mismatch_observation_closeout.json",
  "source_strategy_definition_id_mismatch_observation_closeout.json",
  "source_strategy_run_intent_id_mismatch_observation_closeout.json",
  "unsafe_strategy_observation_stack_closeout_artifact_path.json",
  "forbidden_strategy_observation_stack_closeout_credential_path.json",
  "forbidden_strategy_observation_stack_closeout_execution_field.json",
  "forbidden_strategy_observation_stack_closeout_signal_field.json",
  "forbidden_strategy_observation_stack_closeout_decision_field.json",
  "forbidden_strategy_observation_stack_closeout_order_field.json",
  "forbidden_strategy_observation_stack_closeout_recommendation_field.json",
  "forbidden_strategy_observation_stack_closeout_bankroll_field.json",
  "forbidden_strategy_observation_stack_closeout_analytics_field.json"
];

test("negative StrategyObservationStackCloseoutCheckpoint fixtures fail deterministically", async () => {
  for (const fixture of negativeFixtures) {
    const report = await validateStrategyObservationStackCloseoutCheckpointFile({
      filePath: path.join(negativeDir, fixture),
      repoRoot
    });

    assert.equal(report.ok, false, `${fixture} should fail validation`);
    assert.ok(report.errors.length > 0, `${fixture} should report at least one error`);
  }
});
