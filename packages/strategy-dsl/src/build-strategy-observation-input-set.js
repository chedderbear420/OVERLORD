import path from "node:path";
import { buildStrategyObservationContract, defaultStrategyObservationPaths, readStrategyObservationSources } from "./build-strategy-observation-contract.js";
import { strategyObservationInputSetId } from "./strategy-observation-input-set-id.js";

export async function buildStrategyObservationInputSet(options = {}) {
  const repoRoot = options.repoRoot ?? path.resolve(import.meta.dirname, "..", "..", "..");
  const generatedAt = options.generatedAt ?? "2026-04-28T14:05:06Z";
  const paths = { ...defaultStrategyObservationPaths, ...options.paths };
  const sources = options.sources ?? await readStrategyObservationSources(repoRoot, paths);
  const contract = options.contract ?? await buildStrategyObservationContract({ repoRoot, generatedAt, paths, sources });
  const inputArtifacts = buildInputArtifacts({ paths, sources });

  return {
    strategy_observation_input_set_id: strategyObservationInputSetId({
      strategyObservationContractId: contract.strategy_observation_contract_id,
      strategyDryRunStackCloseoutCheckpointId: sources.closeout.strategy_dry_run_stack_closeout_checkpoint_id,
      inputArtifactCount: inputArtifacts.length
    }),
    schema_version: "strategy_observation_input_set.v1",
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    strategy_observation_contract_id: contract.strategy_observation_contract_id,
    strategy_dry_run_stack_closeout_checkpoint_id: sources.closeout.strategy_dry_run_stack_closeout_checkpoint_id,
    source_strategy_dry_run_stack_closeout_checkpoint_id: sources.closeout.strategy_dry_run_stack_closeout_checkpoint_id,
    source_strategy_dry_run_case_file_summary_id: sources.caseFile.strategy_dry_run_case_file_summary_id,
    source_strategy_dry_run_evidence_bundle_id: sources.dryRunEvidenceBundle.strategy_dry_run_evidence_bundle_id,
    source_strategy_definition_id: contract.strategy_definition_id,
    source_strategy_run_intent_id: contract.strategy_run_intent_id,
    replay_mode: contract.replay_mode,
    run_mode: contract.run_mode,
    input_artifacts: inputArtifacts,
    status: "strategy_observation_input_set_ready",
    reason: "Offline observation input inventory for immutable Phase 2 dry-run metadata only. No strategy logic, signals, decisions, trades, recommendations, analytics, or bankroll outputs are produced."
  };
}

function buildInputArtifacts({ paths, sources }) {
  const closeoutByType = new Map(sources.closeout.closeout_artifacts.map((artifact) => [artifact.artifact_type, artifact]));
  const dryRunTraceArtifact = closeoutByType.get("strategy_dry_run_trace");
  const dryRunNoopSummaryArtifact = closeoutByType.get("strategy_dry_run_noop_summary");
  return [
    makeArtifact("strategy_definition", closeoutByType.get("strategy_definition"), 1),
    makeArtifact("strategy_run_intent", closeoutByType.get("strategy_run_intent"), 1),
    makeArtifact("strategy_dry_run_trace", dryRunTraceArtifact, sources.dryRunTrace.length),
    makeArtifact("strategy_dry_run_noop_summary", dryRunNoopSummaryArtifact, 1),
    {
      artifact_type: "strategy_dry_run_case_file_summary",
      artifact_path: paths.dryRunCaseFileSummaryPath,
      artifact_id: sources.caseFile.strategy_dry_run_case_file_summary_id,
      record_count: 1,
      access_mode: "read_only"
    }
  ];
}

function makeArtifact(artifactType, sourceArtifact, recordCount) {
  return {
    artifact_type: artifactType,
    artifact_path: sourceArtifact.artifact_path,
    artifact_id: sourceArtifact.artifact_id,
    record_count: recordCount,
    access_mode: "read_only"
  };
}
