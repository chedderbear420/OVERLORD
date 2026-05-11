import path from "node:path";
import {
  buildStrategyObservationProcessingContract,
  defaultStrategyObservationProcessingPaths,
  readStrategyObservationProcessingSources
} from "./build-strategy-observation-processing-contract.js";
import { buildStrategyObservationProcessingInputSet } from "./build-strategy-observation-processing-input-set.js";
import { strategyObservationProcessingTraceId } from "./strategy-observation-processing-trace-id.js";

export async function buildStrategyObservationProcessingTraces(options = {}) {
  const repoRoot = options.repoRoot ?? path.resolve(import.meta.dirname, "..", "..", "..");
  const generatedAt = options.generatedAt ?? "2026-04-28T14:05:06Z";
  const paths = { ...defaultStrategyObservationProcessingPaths, ...options.paths };
  const sources = options.sources ?? await readStrategyObservationProcessingSources(repoRoot, paths);
  const contract = options.contract ?? await buildStrategyObservationProcessingContract({ repoRoot, generatedAt, paths, sources });
  const inputSet = options.inputSet ?? await buildStrategyObservationProcessingInputSet({ repoRoot, generatedAt, paths, sources, contract });

  const traces = [];

  traces.push(makeTrace({
    contract,
    inputSet,
    generatedAt,
    traceIndex: 0,
    traceEventType: "noop_processing_started",
    observedInputType: null,
    observedArtifactPath: null,
    observedRecordCount: null,
    reason: "No-op observation processing started from validated processing contract and input set. No strategy logic executed."
  }));

  for (const artifact of inputSet.input_artifacts) {
    traces.push(makeTrace({
      contract,
      inputSet,
      generatedAt,
      traceIndex: traces.length,
      traceEventType: "noop_processing_input_seen",
      observedInputType: artifact.artifact_type,
      observedArtifactPath: artifact.artifact_path,
      observedRecordCount: artifact.record_count,
      reason: "No-op observation processing saw approved read-only input artifact. No signals, decisions, trades, recommendations, analytics, or bankroll outputs created."
    }));
  }

  traces.push(makeTrace({
    contract,
    inputSet,
    generatedAt,
    traceIndex: traces.length,
    traceEventType: "noop_processing_completed",
    observedInputType: null,
    observedArtifactPath: null,
    observedRecordCount: null,
    reason: "No-op observation processing completed. No strategy logic executed."
  }));

  return traces;
}

function makeTrace({
  contract,
  inputSet,
  generatedAt,
  traceIndex,
  traceEventType,
  observedInputType,
  observedArtifactPath,
  observedRecordCount,
  reason
}) {
  return {
    strategy_observation_processing_trace_id: strategyObservationProcessingTraceId({
      strategyObservationProcessingContractId: contract.strategy_observation_processing_contract_id,
      strategyObservationProcessingInputSetId: inputSet.strategy_observation_processing_input_set_id,
      traceIndex,
      traceEventType,
      observedInputType,
      observedArtifactPath
    }),
    schema_version: "strategy_observation_processing_trace.v1",
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
    trace_event_type: traceEventType,
    trace_index: traceIndex,
    observed_input_type: observedInputType,
    observed_artifact_path: observedArtifactPath,
    observed_record_count: observedRecordCount,
    status: "processing_trace_recorded",
    reason
  };
}
