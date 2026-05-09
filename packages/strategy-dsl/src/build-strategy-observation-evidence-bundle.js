import path from "node:path";
import {
  defaultStrategyObservationArtifactPaths,
  readStrategyObservationSources,
  strategyObservationArtifactContracts
} from "./strategy-observation-artifacts.js";
import { strategyObservationEvidenceBundleId } from "./strategy-observation-evidence-bundle-id.js";

export async function buildStrategyObservationEvidenceBundle(options = {}) {
  const repoRoot = options.repoRoot ?? path.resolve(import.meta.dirname, "..", "..", "..");
  const generatedAt = options.generatedAt ?? "2026-04-28T14:05:06Z";
  const paths = { ...defaultStrategyObservationArtifactPaths, ...options.paths };
  const sources = options.sources ?? await readStrategyObservationSources(repoRoot, paths);
  const evidenceArtifacts = strategyObservationArtifactContracts.map((contract) => makeEvidenceArtifact(contract, paths, sources));
  const consistencyChecks = buildStrategyObservationEvidenceConsistencyChecks({ sources, evidenceArtifacts });
  const allChecksPassed = consistencyChecks.every((check) => check.status === "check_passed");

  return {
    strategy_observation_evidence_bundle_id: strategyObservationEvidenceBundleId({
      strategyObservationContractId: sources.observationContract.strategy_observation_contract_id,
      strategyObservationInputSetId: sources.observationInputSet.strategy_observation_input_set_id,
      strategyObservationNoopSummaryId: sources.observationNoopSummary.strategy_observation_noop_summary_id,
      strategyDryRunStackCloseoutCheckpointId: sources.observationContract.strategy_dry_run_stack_closeout_checkpoint_id,
      traceCount: sources.observationTraces.length
    }),
    schema_version: "strategy_observation_evidence_bundle.v1",
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    strategy_observation_contract_id: sources.observationContract.strategy_observation_contract_id,
    strategy_observation_input_set_id: sources.observationInputSet.strategy_observation_input_set_id,
    strategy_observation_noop_summary_id: sources.observationNoopSummary.strategy_observation_noop_summary_id,
    strategy_dry_run_stack_closeout_checkpoint_id: sources.observationContract.strategy_dry_run_stack_closeout_checkpoint_id,
    strategy_definition_id: sources.observationContract.strategy_definition_id,
    strategy_run_intent_id: sources.observationContract.strategy_run_intent_id,
    source_strategy_observation_contract_id: sources.observationContract.strategy_observation_contract_id,
    source_strategy_observation_input_set_id: sources.observationInputSet.strategy_observation_input_set_id,
    source_strategy_observation_noop_summary_id: sources.observationNoopSummary.strategy_observation_noop_summary_id,
    source_strategy_dry_run_stack_closeout_checkpoint_id: sources.observationContract.strategy_dry_run_stack_closeout_checkpoint_id,
    source_strategy_definition_id: sources.observationContract.strategy_definition_id,
    source_strategy_run_intent_id: sources.observationContract.strategy_run_intent_id,
    replay_mode: sources.observationContract.replay_mode,
    run_mode: sources.observationContract.run_mode,
    evidence_artifacts: evidenceArtifacts,
    consistency_checks: consistencyChecks,
    status: allChecksPassed ? "observation_evidence_bundle_ready" : "observation_evidence_bundle_rejected",
    reason: "Strategy observation evidence bundle for local no-op observation only. No strategy logic, signals, decisions, trades, recommendations, analytics, or bankroll actions produced."
  };
}

export function buildStrategyObservationEvidenceConsistencyChecks({ sources, evidenceArtifacts }) {
  return [
    makeCheck("observation_contract_id_alignment", sources.observationInputSet.strategy_observation_contract_id === sources.observationContract.strategy_observation_contract_id
      && sources.observationTraces.every((trace) => trace.strategy_observation_contract_id === sources.observationContract.strategy_observation_contract_id)
      && sources.observationNoopSummary.strategy_observation_contract_id === sources.observationContract.strategy_observation_contract_id),
    makeCheck("observation_input_set_id_alignment", sources.observationTraces.every((trace) => trace.strategy_observation_input_set_id === sources.observationInputSet.strategy_observation_input_set_id)
      && sources.observationNoopSummary.strategy_observation_input_set_id === sources.observationInputSet.strategy_observation_input_set_id),
    makeCheck("observation_noop_summary_id_alignment", typeof sources.observationNoopSummary.strategy_observation_noop_summary_id === "string"
      && sources.observationNoopSummary.strategy_observation_noop_summary_id.startsWith("sons_")),
    makeCheck("trace_record_total_alignment", sources.observationTraces.length === sources.observationNoopSummary.total_trace_records),
    makeCheck("observed_input_total_alignment", sources.observationTraces.filter((trace) => trace.trace_event_type === "noop_observation_input_seen").length === sources.observationNoopSummary.total_inputs_observed),
    makeCheck("evidence_artifact_contract_count", evidenceArtifacts.length === strategyObservationArtifactContracts.length)
  ];
}

function makeEvidenceArtifact(contract, paths, sources) {
  const source = {
    strategy_observation_contract: sources.observationContract,
    strategy_observation_input_set: sources.observationInputSet,
    strategy_observation_noop_summary: sources.observationNoopSummary
  }[contract.artifact_type];
  return {
    artifact_type: contract.artifact_type,
    artifact_path: paths[contract.pathKey],
    schema_version: contract.schema_version,
    record_count: contract.artifact_type === "strategy_observation_trace" ? sources.observationTraces.length : 1,
    validation_command: contract.validation_command,
    artifact_id: contract.id_field ? source[contract.id_field] : null
  };
}

function makeCheck(checkName, passed) {
  return {
    check_name: checkName,
    status: passed ? "check_passed" : "check_failed",
    reason: passed ? `${checkName} passed.` : `${checkName} failed.`
  };
}
