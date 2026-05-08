import path from "node:path";
import { readJson, readJsonl } from "./strategy-dry-run-artifacts.js";
import { strategyObservationContractId } from "./strategy-observation-contract-id.js";

export const defaultStrategyObservationPaths = {
  dryRunStackCloseoutCheckpointPath: "packages/strategy-dsl/fixtures/synthetic_strategy_dry_run_stack_closeout_checkpoint.json",
  dryRunCaseFileSummaryPath: "packages/strategy-dsl/fixtures/synthetic_strategy_dry_run_case_file_summary.json",
  dryRunEvidenceBundlePath: "packages/strategy-dsl/fixtures/synthetic_strategy_dry_run_evidence_bundle.json",
  dryRunTracePath: "packages/strategy-dsl/fixtures/synthetic_strategy_dry_run_trace.jsonl"
};

export const allowedObservationInputs = [
  "strategy_definition",
  "strategy_run_intent",
  "strategy_dry_run_trace",
  "strategy_dry_run_noop_summary",
  "strategy_dry_run_case_file_summary",
  "replay_trace",
  "replay_clock",
  "replay_read_plan",
  "market_state_metadata"
];

export const requiredForbiddenObservationOutputs = [
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
  "analytics"
];

export const allowedObservationRules = [
  "read_only_inputs",
  "preserve_source_provenance",
  "emit_observation_metadata_only",
  "no_signal_generation",
  "no_decision_generation",
  "no_trade_generation",
  "no_recommendations",
  "no_bankroll_outputs",
  "no_network"
];

export async function buildStrategyObservationContract(options = {}) {
  const repoRoot = options.repoRoot ?? path.resolve(import.meta.dirname, "..", "..", "..");
  const generatedAt = options.generatedAt ?? "2026-04-28T14:05:06Z";
  const paths = { ...defaultStrategyObservationPaths, ...options.paths };
  const sources = options.sources ?? await readStrategyObservationSources(repoRoot, paths);
  const strategyDefinitionId = sources.dryRunEvidenceBundle.strategy_definition_id;
  const strategyRunIntentId = sources.dryRunEvidenceBundle.strategy_run_intent_id;

  return {
    strategy_observation_contract_id: strategyObservationContractId({
      strategyDefinitionId,
      strategyRunIntentId,
      strategyDryRunStackCloseoutCheckpointId: sources.closeout.strategy_dry_run_stack_closeout_checkpoint_id,
      allowedObservationInputCount: allowedObservationInputs.length,
      forbiddenObservationOutputCount: requiredForbiddenObservationOutputs.length
    }),
    schema_version: "strategy_observation_contract.v1",
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    strategy_definition_id: strategyDefinitionId,
    strategy_run_intent_id: strategyRunIntentId,
    strategy_dry_run_stack_closeout_checkpoint_id: sources.closeout.strategy_dry_run_stack_closeout_checkpoint_id,
    source_strategy_dry_run_stack_closeout_checkpoint_id: sources.closeout.strategy_dry_run_stack_closeout_checkpoint_id,
    source_strategy_dry_run_case_file_summary_id: sources.caseFile.strategy_dry_run_case_file_summary_id,
    source_strategy_dry_run_evidence_bundle_id: sources.dryRunEvidenceBundle.strategy_dry_run_evidence_bundle_id,
    source_strategy_dry_run_trace_ids: sources.dryRunTrace.map((trace) => trace.strategy_dry_run_trace_id),
    source_strategy_definition_id: strategyDefinitionId,
    source_strategy_run_intent_id: strategyRunIntentId,
    replay_mode: sources.closeout.replay_mode,
    run_mode: sources.closeout.run_mode,
    allowed_observation_inputs: allowedObservationInputs,
    forbidden_observation_outputs: requiredForbiddenObservationOutputs,
    observation_rules: allowedObservationRules,
    status: "strategy_observation_contract_ready",
    reason: "Offline strategy observation contract for immutable Phase 2 dry-run metadata only. No strategy logic, signals, decisions, trades, recommendations, analytics, or bankroll outputs are produced."
  };
}

export async function readStrategyObservationSources(repoRoot, paths) {
  return {
    closeout: await readJson(repoRoot, paths.dryRunStackCloseoutCheckpointPath),
    caseFile: await readJson(repoRoot, paths.dryRunCaseFileSummaryPath),
    dryRunEvidenceBundle: await readJson(repoRoot, paths.dryRunEvidenceBundlePath),
    dryRunTrace: await readJsonl(repoRoot, paths.dryRunTracePath)
  };
}
