import { strategyNoopRunSummaryId } from "./strategy-noop-run-summary-id.js";
import { strategyRunTraceId } from "./strategy-run-trace-id.js";

export function buildStrategyRunTraces({ strategyDefinition, strategyRunIntent, replayEvidenceBundle, replayTraces, generatedAt }) {
  const traceGeneratedAt = generatedAt ?? replayEvidenceBundle.generated_at;
  const traces = [];

  traces.push(makeTrace({
    strategyDefinition,
    strategyRunIntent,
    replayEvidenceBundle,
    generatedAt: traceGeneratedAt,
    traceIndex: 0,
    traceEventType: "noop_strategy_run_started",
    artifactType: "strategy_control",
    artifactPath: replayEvidenceBundle.source_trace_path,
    recordRef: "noop_strategy:start",
    recordTime: traceGeneratedAt,
    recordId: null,
    sourceReplayTraceId: null,
    reason: "No-op strategy run started. No strategy logic executed."
  }));

  for (const replayTrace of replayTraces.filter((trace) => trace.trace_event_type === "noop_record_read")) {
    traces.push(makeTrace({
      strategyDefinition,
      strategyRunIntent,
      replayEvidenceBundle,
      generatedAt: traceGeneratedAt,
      traceIndex: traces.length,
      traceEventType: "noop_strategy_input_observed",
      artifactType: replayTrace.artifact_type,
      artifactPath: replayTrace.artifact_path,
      recordRef: replayTrace.record_ref,
      recordTime: replayTrace.record_time,
      recordId: replayTrace.record_id ?? null,
      sourceReplayTraceId: replayTrace.replay_trace_id,
      reason: "No-op strategy shell observed replay input metadata. No signals, decisions, trades, or recommendations created."
    }));
  }

  traces.push(makeTrace({
    strategyDefinition,
    strategyRunIntent,
    replayEvidenceBundle,
    generatedAt: traceGeneratedAt,
    traceIndex: traces.length,
    traceEventType: "noop_strategy_run_completed",
    artifactType: "strategy_control",
    artifactPath: replayEvidenceBundle.source_trace_path,
    recordRef: "noop_strategy:completed",
    recordTime: traceGeneratedAt,
    recordId: null,
    sourceReplayTraceId: null,
    reason: "No-op strategy run completed. No strategy logic executed."
  }));

  return traces;
}

export function buildStrategyNoopRunSummary({ strategyDefinition, strategyRunIntent, replayEvidenceBundle, traces, generatedAt }) {
  const summaryGeneratedAt = generatedAt ?? replayEvidenceBundle.generated_at;
  const totalInputsObserved = traces.filter((trace) => trace.trace_event_type === "noop_strategy_input_observed").length;

  return {
    strategy_noop_run_summary_id: strategyNoopRunSummaryId(strategyRunIntent.strategy_run_intent_id, traces.length, totalInputsObserved),
    schema_version: "strategy_noop_run_summary.v1",
    generated_at: summaryGeneratedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    strategy_definition_id: strategyDefinition.strategy_definition_id,
    strategy_run_intent_id: strategyRunIntent.strategy_run_intent_id,
    source_replay_run_manifest_id: strategyRunIntent.source_replay_run_manifest_id,
    source_replay_evidence_bundle_id: strategyRunIntent.source_replay_evidence_bundle_id,
    source_replay_clock_id: replayEvidenceBundle.source_replay_clock_id,
    source_replay_read_plan_id: replayEvidenceBundle.source_replay_read_plan_id,
    replay_mode: strategyRunIntent.replay_mode,
    run_mode: strategyRunIntent.run_mode,
    total_trace_records: traces.length,
    total_inputs_observed: totalInputsObserved,
    status: "strategy_noop_summary_ready",
    reason: "No-op strategy summary only. No strategy logic, signals, decisions, trades, recommendations, or analytics produced."
  };
}

function makeTrace({
  strategyDefinition,
  strategyRunIntent,
  replayEvidenceBundle,
  generatedAt,
  traceIndex,
  traceEventType,
  artifactType,
  artifactPath,
  recordRef,
  recordTime,
  recordId,
  sourceReplayTraceId,
  reason
}) {
  return {
    strategy_run_trace_id: strategyRunTraceId(strategyRunIntent.strategy_run_intent_id, traceIndex, traceEventType, recordRef),
    schema_version: "strategy_run_trace.v1",
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    strategy_definition_id: strategyDefinition.strategy_definition_id,
    strategy_run_intent_id: strategyRunIntent.strategy_run_intent_id,
    source_replay_run_manifest_id: strategyRunIntent.source_replay_run_manifest_id,
    source_replay_evidence_bundle_id: strategyRunIntent.source_replay_evidence_bundle_id,
    source_replay_clock_id: replayEvidenceBundle.source_replay_clock_id,
    source_replay_read_plan_id: replayEvidenceBundle.source_replay_read_plan_id,
    source_replay_trace_id: sourceReplayTraceId,
    replay_mode: strategyRunIntent.replay_mode,
    run_mode: strategyRunIntent.run_mode,
    trace_event_type: traceEventType,
    trace_index: traceIndex,
    artifact_type: artifactType,
    artifact_path: artifactPath,
    record_ref: recordRef,
    record_time: recordTime,
    record_id: recordId,
    status: "strategy_trace_recorded",
    reason
  };
}
