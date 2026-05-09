import path from "node:path";
import {
  buildStrategyObservationProcessingContract,
  defaultStrategyObservationProcessingPaths,
  readStrategyObservationProcessingSources
} from "./build-strategy-observation-processing-contract.js";
import { strategyObservationProcessingInputSetId } from "./strategy-observation-processing-input-set-id.js";

export async function buildStrategyObservationProcessingInputSet(options = {}) {
  const repoRoot = options.repoRoot ?? path.resolve(import.meta.dirname, "..", "..", "..");
  const generatedAt = options.generatedAt ?? "2026-04-28T14:05:06Z";
  const paths = { ...defaultStrategyObservationProcessingPaths, ...options.paths };
  const sources = options.sources ?? await readStrategyObservationProcessingSources(repoRoot, paths);
  const contract = options.contract ?? await buildStrategyObservationProcessingContract({ repoRoot, generatedAt, paths, sources });
  const inputArtifacts = buildProcessingInputArtifacts({ paths, sources });

  return {
    strategy_observation_processing_input_set_id: strategyObservationProcessingInputSetId({
      strategyObservationProcessingContractId: contract.strategy_observation_processing_contract_id,
      strategyObservationStackCloseoutCheckpointId: sources.closeout.strategy_observation_stack_closeout_checkpoint_id,
      inputArtifactCount: inputArtifacts.length
    }),
    schema_version: "strategy_observation_processing_input_set.v1",
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    strategy_observation_processing_contract_id: contract.strategy_observation_processing_contract_id,
    strategy_observation_stack_closeout_checkpoint_id: sources.closeout.strategy_observation_stack_closeout_checkpoint_id,
    source_strategy_observation_stack_closeout_checkpoint_id: sources.closeout.strategy_observation_stack_closeout_checkpoint_id,
    source_strategy_observation_case_file_summary_id: sources.caseFile.strategy_observation_case_file_summary_id,
    source_strategy_observation_evidence_bundle_id: sources.evidenceBundle.strategy_observation_evidence_bundle_id,
    source_strategy_observation_noop_summary_id: sources.noopSummary.strategy_observation_noop_summary_id,
    source_strategy_definition_id: contract.strategy_definition_id,
    source_strategy_run_intent_id: contract.strategy_run_intent_id,
    replay_mode: contract.replay_mode,
    run_mode: contract.run_mode,
    input_artifacts: inputArtifacts,
    status: "strategy_observation_processing_input_set_ready",
    reason: "Offline observation processing input inventory for immutable Phase 3 observation metadata only. No strategy logic, signals, decisions, trades, recommendations, analytics, or bankroll outputs are produced."
  };
}

function buildProcessingInputArtifacts({ paths, sources }) {
  const closeoutByType = new Map(sources.closeout.closeout_artifacts.map((artifact) => [artifact.artifact_type, artifact]));
  return [
    makeArtifact(closeoutByType.get("strategy_observation_contract")),
    makeArtifact(closeoutByType.get("strategy_observation_input_set")),
    makeArtifact(closeoutByType.get("strategy_observation_trace")),
    makeArtifact(closeoutByType.get("strategy_observation_noop_summary")),
    makeArtifact(closeoutByType.get("strategy_observation_evidence_bundle")),
    makeArtifact(closeoutByType.get("strategy_observation_case_file_summary")),
    {
      artifact_type: "strategy_observation_stack_closeout_checkpoint",
      artifact_path: paths.observationStackCloseoutCheckpointPath,
      artifact_id: sources.closeout.strategy_observation_stack_closeout_checkpoint_id,
      record_count: 1,
      access_mode: "read_only"
    }
  ];
}

function makeArtifact(sourceArtifact) {
  return {
    artifact_type: sourceArtifact.artifact_type,
    artifact_path: sourceArtifact.artifact_path,
    artifact_id: sourceArtifact.artifact_id,
    record_count: sourceArtifact.record_count,
    access_mode: "read_only"
  };
}
