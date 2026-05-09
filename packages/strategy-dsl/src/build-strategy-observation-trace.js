import { strategyObservationNoopSummaryId } from "./strategy-observation-noop-summary-id.js";
import { strategyObservationTraceId } from "./strategy-observation-trace-id.js";

export function buildStrategyObservationTraces({
  observationContract,
  observationInputSet,
  generatedAt
}) {
  const traceGeneratedAt = generatedAt ?? observationContract.generated_at;
  const traces = [];

  traces.push(makeTrace({
    observationContract,
    observationInputSet,
    generatedAt: traceGeneratedAt,
    traceIndex: 0,
    traceEventType: "noop_observation_started",
    observedInputType: null,
    observedArtifactPath: null,
    observedRecordCount: null,
    reason: "No-op observation started from validated observation contract and input set. No strategy logic executed."
  }));

  for (const artifact of observationInputSet.input_artifacts) {
    traces.push(makeTrace({
      observationContract,
      observationInputSet,
      generatedAt: traceGeneratedAt,
      traceIndex: traces.length,
      traceEventType: "noop_observation_input_seen",
      observedInputType: artifact.artifact_type,
      observedArtifactPath: artifact.artifact_path,
      observedRecordCount: artifact.record_count,
      reason: "No-op observation saw approved read-only input metadata. No signals, decisions, trades, recommendations, analytics, or bankroll outputs created."
    }));
  }

  traces.push(makeTrace({
    observationContract,
    observationInputSet,
    generatedAt: traceGeneratedAt,
    traceIndex: traces.length,
    traceEventType: "noop_observation_completed",
    observedInputType: null,
    observedArtifactPath: null,
    observedRecordCount: null,
    reason: "No-op observation completed. No strategy logic executed."
  }));

  return traces;
}

export function buildStrategyObservationNoOpSummary({
  observationContract,
  observationInputSet,
  traces,
  generatedAt
}) {
  const totalInputsObserved = traces.filter((trace) => trace.trace_event_type === "noop_observation_input_seen").length;
  return {
    strategy_observation_noop_summary_id: strategyObservationNoopSummaryId({
      strategyObservationContractId: observationContract.strategy_observation_contract_id,
      strategyObservationInputSetId: observationInputSet.strategy_observation_input_set_id,
      totalTraceRecords: traces.length,
      totalInputsObserved
    }),
    schema_version: "strategy_observation_noop_summary.v1",
    generated_at: generatedAt ?? observationContract.generated_at,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    strategy_observation_contract_id: observationContract.strategy_observation_contract_id,
    strategy_observation_input_set_id: observationInputSet.strategy_observation_input_set_id,
    strategy_dry_run_stack_closeout_checkpoint_id: observationContract.strategy_dry_run_stack_closeout_checkpoint_id,
    source_strategy_observation_contract_id: observationContract.strategy_observation_contract_id,
    source_strategy_observation_input_set_id: observationInputSet.strategy_observation_input_set_id,
    source_strategy_dry_run_stack_closeout_checkpoint_id: observationContract.strategy_dry_run_stack_closeout_checkpoint_id,
    source_strategy_definition_id: observationContract.strategy_definition_id,
    source_strategy_run_intent_id: observationContract.strategy_run_intent_id,
    replay_mode: observationContract.replay_mode,
    run_mode: observationContract.run_mode,
    total_trace_records: traces.length,
    total_inputs_observed: totalInputsObserved,
    status: "observation_noop_summary_ready",
    reason: "No-op observation summary only. No strategy logic, signals, decisions, trades, recommendations, analytics, or bankroll actions produced."
  };
}

function makeTrace({
  observationContract,
  observationInputSet,
  generatedAt,
  traceIndex,
  traceEventType,
  observedInputType,
  observedArtifactPath,
  observedRecordCount,
  reason
}) {
  return {
    strategy_observation_trace_id: strategyObservationTraceId({
      strategyObservationContractId: observationContract.strategy_observation_contract_id,
      strategyObservationInputSetId: observationInputSet.strategy_observation_input_set_id,
      traceIndex,
      traceEventType,
      observedInputType,
      observedArtifactPath
    }),
    schema_version: "strategy_observation_trace.v1",
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    strategy_observation_contract_id: observationContract.strategy_observation_contract_id,
    strategy_observation_input_set_id: observationInputSet.strategy_observation_input_set_id,
    strategy_dry_run_stack_closeout_checkpoint_id: observationContract.strategy_dry_run_stack_closeout_checkpoint_id,
    strategy_definition_id: observationContract.strategy_definition_id,
    strategy_run_intent_id: observationContract.strategy_run_intent_id,
    source_strategy_observation_contract_id: observationContract.strategy_observation_contract_id,
    source_strategy_observation_input_set_id: observationInputSet.strategy_observation_input_set_id,
    source_strategy_dry_run_stack_closeout_checkpoint_id: observationContract.strategy_dry_run_stack_closeout_checkpoint_id,
    source_strategy_definition_id: observationContract.strategy_definition_id,
    source_strategy_run_intent_id: observationContract.strategy_run_intent_id,
    replay_mode: observationContract.replay_mode,
    run_mode: observationContract.run_mode,
    trace_event_type: traceEventType,
    trace_index: traceIndex,
    observed_input_type: observedInputType,
    observed_artifact_path: observedArtifactPath,
    observed_record_count: observedRecordCount,
    status: "observation_trace_recorded",
    reason
  };
}
