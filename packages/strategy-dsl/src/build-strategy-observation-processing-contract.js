import path from "node:path";
import { readJson, readJsonl } from "./strategy-dry-run-artifacts.js";
import { strategyObservationProcessingContractId } from "./strategy-observation-processing-contract-id.js";

export const defaultStrategyObservationProcessingPaths = {
  observationStackCloseoutCheckpointPath: "packages/strategy-dsl/fixtures/synthetic_strategy_observation_stack_closeout_checkpoint.json",
  observationCaseFileSummaryPath: "packages/strategy-dsl/fixtures/synthetic_strategy_observation_case_file_summary.json",
  observationEvidenceBundlePath: "packages/strategy-dsl/fixtures/synthetic_strategy_observation_evidence_bundle.json",
  observationTracePath: "packages/strategy-dsl/fixtures/synthetic_strategy_observation_trace.jsonl",
  observationNoopSummaryPath: "packages/strategy-dsl/fixtures/synthetic_strategy_observation_noop_summary.json"
};

export const allowedProcessingInputs = [
  "strategy_observation_contract",
  "strategy_observation_input_set",
  "strategy_observation_trace",
  "strategy_observation_noop_summary",
  "strategy_observation_evidence_bundle",
  "strategy_observation_case_file_summary",
  "strategy_observation_stack_closeout_checkpoint"
];

export const allowedProcessingOutputs = [
  "observation_processing_trace",
  "observation_processing_noop_summary",
  "observation_processing_evidence_bundle",
  "observation_processing_case_file_summary"
];

export const requiredForbiddenProcessingOutputs = [
  "edge_signal",
  "risk_decision",
  "action_decision",
  "paper_ledger_entry",
  "paper_exit",
  "live_order",
  "real_trade",
  "credential",
  "api_key",
  "bankroll_allocation",
  "recommendation",
  "analytics",
  "strategy_analytics"
];

export const allowedProcessingRules = [
  "read_only_inputs",
  "preserve_source_provenance",
  "emit_processing_metadata_only",
  "no_signal_generation",
  "no_decision_generation",
  "no_trade_generation",
  "no_recommendations",
  "no_bankroll_outputs",
  "no_analytics",
  "no_network"
];

export async function buildStrategyObservationProcessingContract(options = {}) {
  const repoRoot = options.repoRoot ?? path.resolve(import.meta.dirname, "..", "..", "..");
  const generatedAt = options.generatedAt ?? "2026-04-28T14:05:06Z";
  const paths = { ...defaultStrategyObservationProcessingPaths, ...options.paths };
  const sources = options.sources ?? await readStrategyObservationProcessingSources(repoRoot, paths);
  const strategyDefinitionId = sources.closeout.source_strategy_definition_id;
  const strategyRunIntentId = sources.closeout.source_strategy_run_intent_id;

  return {
    strategy_observation_processing_contract_id: strategyObservationProcessingContractId({
      strategyDefinitionId,
      strategyRunIntentId,
      strategyObservationStackCloseoutCheckpointId: sources.closeout.strategy_observation_stack_closeout_checkpoint_id,
      allowedProcessingInputCount: allowedProcessingInputs.length,
      allowedProcessingOutputCount: allowedProcessingOutputs.length,
      forbiddenProcessingOutputCount: requiredForbiddenProcessingOutputs.length
    }),
    schema_version: "strategy_observation_processing_contract.v1",
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    strategy_definition_id: strategyDefinitionId,
    strategy_run_intent_id: strategyRunIntentId,
    strategy_observation_stack_closeout_checkpoint_id: sources.closeout.strategy_observation_stack_closeout_checkpoint_id,
    source_strategy_observation_stack_closeout_checkpoint_id: sources.closeout.strategy_observation_stack_closeout_checkpoint_id,
    source_strategy_observation_case_file_summary_id: sources.caseFile.strategy_observation_case_file_summary_id,
    source_strategy_observation_evidence_bundle_id: sources.evidenceBundle.strategy_observation_evidence_bundle_id,
    source_strategy_observation_noop_summary_id: sources.noopSummary.strategy_observation_noop_summary_id,
    source_strategy_definition_id: strategyDefinitionId,
    source_strategy_run_intent_id: strategyRunIntentId,
    replay_mode: sources.closeout.replay_mode,
    run_mode: sources.closeout.run_mode,
    allowed_processing_inputs: allowedProcessingInputs,
    allowed_processing_outputs: allowedProcessingOutputs,
    forbidden_processing_outputs: requiredForbiddenProcessingOutputs,
    processing_rules: allowedProcessingRules,
    status: "strategy_observation_processing_contract_ready",
    reason_code: "VALIDATION_PASSED",
    reason: "metadata boundary ready"
  };
}

export async function readStrategyObservationProcessingSources(repoRoot, paths) {
  return {
    closeout: await readJson(repoRoot, paths.observationStackCloseoutCheckpointPath),
    caseFile: await readJson(repoRoot, paths.observationCaseFileSummaryPath),
    evidenceBundle: await readJson(repoRoot, paths.observationEvidenceBundlePath),
    trace: await readJsonl(repoRoot, paths.observationTracePath),
    noopSummary: await readJson(repoRoot, paths.observationNoopSummaryPath)
  };
}
