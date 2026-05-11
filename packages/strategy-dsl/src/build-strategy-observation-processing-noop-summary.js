import path from "node:path";
import {
  buildStrategyObservationProcessingContract,
  defaultStrategyObservationProcessingPaths,
  readStrategyObservationProcessingSources
} from "./build-strategy-observation-processing-contract.js";
import { buildStrategyObservationProcessingInputSet } from "./build-strategy-observation-processing-input-set.js";
import { buildStrategyObservationProcessingTraces } from "./build-strategy-observation-processing-trace.js";
import { strategyObservationProcessingNoopSummaryId } from "./strategy-observation-processing-noop-summary-id.js";

export async function buildStrategyObservationProcessingNoopSummary(options = {}) {
  const repoRoot = options.repoRoot ?? path.resolve(import.meta.dirname, "..", "..", "..");
  const generatedAt = options.generatedAt ?? "2026-04-28T14:05:06Z";
  const paths = { ...defaultStrategyObservationProcessingPaths, ...options.paths };
  const sources = options.sources ?? await readStrategyObservationProcessingSources(repoRoot, paths);
  const contract = options.contract ?? await buildStrategyObservationProcessingContract({ repoRoot, generatedAt, paths, sources });
  const inputSet = options.inputSet ?? await buildStrategyObservationProcessingInputSet({ repoRoot, generatedAt, paths, sources, contract });
  const traces = options.traces ?? await buildStrategyObservationProcessingTraces({ repoRoot, generatedAt, paths, sources, contract, inputSet });

  const totalTraceRecords = traces.length;
  const totalInputsObserved = traces.filter((t) => t.trace_event_type === "noop_processing_input_seen").length;

  return {
    strategy_observation_processing_noop_summary_id: strategyObservationProcessingNoopSummaryId({
      strategyObservationProcessingContractId: contract.strategy_observation_processing_contract_id,
      strategyObservationProcessingInputSetId: inputSet.strategy_observation_processing_input_set_id,
      totalTraceRecords,
      totalInputsObserved
    }),
    schema_version: "strategy_observation_processing_noop_summary.v1",
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    strategy_observation_processing_contract_id: contract.strategy_observation_processing_contract_id,
    strategy_observation_processing_input_set_id: inputSet.strategy_observation_processing_input_set_id,
    strategy_observation_stack_closeout_checkpoint_id: inputSet.strategy_observation_stack_closeout_checkpoint_id,
    source_strategy_observation_processing_contract_id: contract.strategy_observation_processing_contract_id,
    source_strategy_observation_processing_input_set_id: inputSet.strategy_observation_processing_input_set_id,
    source_strategy_observation_stack_closeout_checkpoint_id: inputSet.source_strategy_observation_stack_closeout_checkpoint_id,
    source_strategy_definition_id: contract.strategy_definition_id,
    source_strategy_run_intent_id: contract.strategy_run_intent_id,
    replay_mode: contract.replay_mode,
    run_mode: contract.run_mode,
    total_trace_records: totalTraceRecords,
    total_inputs_observed: totalInputsObserved,
    status: "processing_noop_summary_ready",
    reason: "No-op observation processing summary only. No strategy logic, signals, decisions, trades, recommendations, analytics, or bankroll actions produced."
  };
}
