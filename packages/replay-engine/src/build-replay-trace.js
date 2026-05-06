import { replayNoopRunSummaryId } from "./replay-noop-run-summary-id.js";
import { replayTraceId } from "./replay-trace-id.js";

export function buildReplayTraceRecords({ manifest, clock, readPlan, generatedAt }) {
  const traceGeneratedAt = generatedAt ?? clock.generated_at;
  const traces = [];

  traces.push(makeTrace({
    manifest,
    clock,
    readPlan,
    generatedAt: traceGeneratedAt,
    traceIndex: 0,
    traceEventType: "noop_replay_started",
    artifactType: "replay_control",
    artifactPath: clock.source_manifest_path,
    recordRef: "noop_replay:start",
    recordTime: traceGeneratedAt,
    recordId: null,
    reason: "No-op replay walk started. No strategy logic executed."
  }));

  for (const clockEvent of clock.clock_events) {
    traces.push(makeTrace({
      manifest,
      clock,
      readPlan,
      generatedAt: traceGeneratedAt,
      traceIndex: traces.length,
      traceEventType: "noop_record_read",
      artifactType: clockEvent.artifact_type,
      artifactPath: clockEvent.artifact_path,
      recordRef: clockEvent.record_ref,
      recordTime: clockEvent.record_time,
      recordId: clockEvent.record_id ?? null,
      reason: "No-op replay shell observed planned local fixture record. No decisions created."
    }));
  }

  traces.push(makeTrace({
    manifest,
    clock,
    readPlan,
    generatedAt: traceGeneratedAt,
    traceIndex: traces.length,
    traceEventType: "noop_replay_completed",
    artifactType: "replay_control",
    artifactPath: clock.source_manifest_path,
    recordRef: "noop_replay:completed",
    recordTime: traceGeneratedAt,
    recordId: null,
    reason: "No-op replay walk completed. No strategy logic executed."
  }));

  return traces;
}

export function buildReplayNoopRunSummary({ manifest, clock, readPlan, traces, generatedAt }) {
  const traceGeneratedAt = generatedAt ?? clock.generated_at;
  const totalRecordsRead = traces.filter((trace) => trace.trace_event_type === "noop_record_read").length;

  return {
    replay_noop_run_summary_id: replayNoopRunSummaryId(
      clock.replay_clock_id,
      readPlan.replay_read_plan_id,
      traces.length
    ),
    schema_version: "replay_noop_run_summary.v1",
    generated_at: traceGeneratedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    replay_mode: clock.replay_mode,
    source_replay_run_manifest_id: manifest.replay_run_manifest_id,
    source_replay_clock_id: clock.replay_clock_id,
    source_replay_read_plan_id: readPlan.replay_read_plan_id,
    total_trace_records: traces.length,
    total_records_read: totalRecordsRead,
    total_artifacts_read: readPlan.artifact_reads.length,
    status: "noop_replay_summary_ready",
    reason: "No-op replay summary only. No strategy logic, decisions, trades, or analytics produced."
  };
}

function makeTrace({
  manifest,
  clock,
  readPlan,
  generatedAt,
  traceIndex,
  traceEventType,
  artifactType,
  artifactPath,
  recordRef,
  recordTime,
  recordId,
  reason
}) {
  return {
    replay_trace_id: replayTraceId(clock.replay_clock_id, traceIndex, traceEventType, recordRef),
    schema_version: "replay_trace.v1",
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    replay_mode: clock.replay_mode,
    trace_event_type: traceEventType,
    trace_index: traceIndex,
    source_replay_run_manifest_id: manifest.replay_run_manifest_id,
    source_replay_clock_id: clock.replay_clock_id,
    source_replay_read_plan_id: readPlan.replay_read_plan_id,
    source_manifest_path: clock.source_manifest_path,
    artifact_type: artifactType,
    artifact_path: artifactPath,
    record_ref: recordRef,
    record_time: recordTime,
    record_id: recordId,
    status: "trace_recorded",
    reason
  };
}
