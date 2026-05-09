import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateStrategyObservationCaseFileSummaryFile } from "../src/validate-strategy-observation-case-file-summary.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "negative");
const negativeFixtures = [
  "malformed_strategy_observation_case_file_summary.json",
  "bad_strategy_observation_case_file_summary_id.json",
  "missing_strategy_observation_case_file_summary_provenance.json",
  "strategy_observation_case_file_unsafe_live_execution_allowed.json",
  "strategy_observation_case_file_unsafe_order_placement_allowed.json",
  "non_paper_only_strategy_observation_case_file_summary.json",
  "invalid_strategy_observation_case_file_replay_mode.json",
  "invalid_strategy_observation_case_file_run_mode.json",
  "invalid_strategy_observation_case_file_status.json",
  "invalid_strategy_observation_case_file_consistency_status.json",
  "bad_strategy_observation_total_evidence_artifacts.json",
  "bad_strategy_observation_case_file_total_trace_records.json",
  "bad_strategy_observation_case_file_total_inputs_observed.json",
  "case_file_ready_with_failed_observation_consistency.json",
  "source_strategy_observation_evidence_bundle_id_mismatch_case_file.json",
  "source_strategy_observation_contract_id_mismatch_case_file.json",
  "source_strategy_observation_input_set_id_mismatch_case_file.json",
  "source_strategy_observation_noop_summary_id_mismatch_case_file.json",
  "forbidden_strategy_observation_case_file_execution_field.json",
  "forbidden_strategy_observation_case_file_signal_field.json",
  "forbidden_strategy_observation_case_file_decision_field.json",
  "forbidden_strategy_observation_case_file_order_field.json",
  "forbidden_strategy_observation_case_file_recommendation_field.json",
  "forbidden_strategy_observation_case_file_bankroll_field.json",
  "forbidden_strategy_observation_case_file_analytics_field.json",
  "forbidden_strategy_observation_case_file_credential_field.json"
];

test("negative StrategyObservationCaseFileSummary fixtures fail deterministically", async () => {
  for (const fixture of negativeFixtures) {
    const report = await validateStrategyObservationCaseFileSummaryFile({
      filePath: path.join(negativeDir, fixture)
    });

    assert.equal(report.ok, false, `${fixture} should fail validation`);
    assert.ok(report.errors.length > 0, `${fixture} should report at least one error`);
  }
});
