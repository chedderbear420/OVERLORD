import path from "node:path";
import { defaultStrategyObservationArtifactPaths, readJson } from "./strategy-observation-artifacts.js";
import { buildStrategyObservationEvidenceBundle } from "./build-strategy-observation-evidence-bundle.js";
import { strategyObservationCaseFileSummaryId } from "./strategy-observation-case-file-summary-id.js";

export async function buildStrategyObservationCaseFileSummary(options = {}) {
  const repoRoot = options.repoRoot ?? path.resolve(import.meta.dirname, "..", "..", "..");
  const generatedAt = options.generatedAt ?? "2026-04-28T14:05:06Z";
  const paths = { ...defaultStrategyObservationArtifactPaths, ...options.paths };
  const evidenceBundle = options.evidenceBundle ?? await buildStrategyObservationEvidenceBundle({ repoRoot, generatedAt, paths });
  const observationNoopSummary = options.observationNoopSummary ?? await readJson(repoRoot, paths.observationNoopSummaryPath);
  const consistencyStatus = evidenceBundle.consistency_checks.every((check) => check.status === "check_passed")
    ? "consistency_passed"
    : "consistency_failed";

  return {
    strategy_observation_case_file_summary_id: strategyObservationCaseFileSummaryId({
      strategyObservationEvidenceBundleId: evidenceBundle.strategy_observation_evidence_bundle_id,
      strategyObservationContractId: evidenceBundle.strategy_observation_contract_id,
      strategyObservationInputSetId: evidenceBundle.strategy_observation_input_set_id,
      totalEvidenceArtifacts: evidenceBundle.evidence_artifacts.length,
      totalTraceRecords: observationNoopSummary.total_trace_records,
      totalInputsObserved: observationNoopSummary.total_inputs_observed,
      consistencyStatus
    }),
    schema_version: "strategy_observation_case_file_summary.v1",
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    strategy_observation_evidence_bundle_id: evidenceBundle.strategy_observation_evidence_bundle_id,
    strategy_observation_contract_id: evidenceBundle.strategy_observation_contract_id,
    strategy_observation_input_set_id: evidenceBundle.strategy_observation_input_set_id,
    strategy_observation_noop_summary_id: evidenceBundle.strategy_observation_noop_summary_id,
    strategy_dry_run_stack_closeout_checkpoint_id: evidenceBundle.strategy_dry_run_stack_closeout_checkpoint_id,
    replay_mode: evidenceBundle.replay_mode,
    run_mode: evidenceBundle.run_mode,
    total_evidence_artifacts: evidenceBundle.evidence_artifacts.length,
    total_trace_records: observationNoopSummary.total_trace_records,
    total_inputs_observed: observationNoopSummary.total_inputs_observed,
    consistency_status: consistencyStatus,
    status: consistencyStatus === "consistency_passed" ? "observation_case_file_summary_ready" : "observation_case_file_summary_rejected",
    reason: "Strategy observation case-file summary for local no-op observation evidence only. No strategy logic, signals, decisions, trades, recommendations, analytics, or bankroll actions produced."
  };
}
