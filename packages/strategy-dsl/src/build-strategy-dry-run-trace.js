import { strategyDryRunNoopSummaryId } from "./strategy-dry-run-noop-summary-id.js";
import { strategyDryRunTraceId } from "./strategy-dry-run-trace-id.js";

export function buildStrategyDryRunTraces({
  readinessCheckpoint,
  dryRunPlan,
  dryRunPlanEvidenceSummary,
  generatedAt
}) {
  const traceGeneratedAt = generatedAt ?? readinessCheckpoint.generated_at;
  const traces = [];

  traces.push(makeTrace({
    readinessCheckpoint,
    dryRunPlan,
    dryRunPlanEvidenceSummary,
    generatedAt: traceGeneratedAt,
    traceIndex: 0,
    traceEventType: "noop_dry_run_started",
    plannedObservationStep: null,
    observedArtifactType: null,
    observedArtifactRef: "strategy_dry_run:start",
    reason: "No-op dry-run started from validated readiness checkpoint. No strategy logic executed."
  }));

  for (const step of dryRunPlan.planned_observation_steps) {
    traces.push(makeTrace({
      readinessCheckpoint,
      dryRunPlan,
      dryRunPlanEvidenceSummary,
      generatedAt: traceGeneratedAt,
      traceIndex: traces.length,
      traceEventType: "noop_dry_run_step_observed",
      plannedObservationStep: step,
      observedArtifactType: step.reads[0] ?? null,
      observedArtifactRef: `${dryRunPlan.strategy_dry_run_plan_id}#planned_observation_step_${step.step_index}`,
      reason: "No-op dry-run observed planned metadata step. No signals, decisions, trades, recommendations, or analytics created."
    }));
  }

  traces.push(makeTrace({
    readinessCheckpoint,
    dryRunPlan,
    dryRunPlanEvidenceSummary,
    generatedAt: traceGeneratedAt,
    traceIndex: traces.length,
    traceEventType: "noop_dry_run_completed",
    plannedObservationStep: null,
    observedArtifactType: null,
    observedArtifactRef: "strategy_dry_run:completed",
    reason: "No-op dry-run completed. No strategy logic executed."
  }));

  return traces;
}

export function buildStrategyDryRunNoOpSummary({
  readinessCheckpoint,
  dryRunPlan,
  dryRunPlanEvidenceSummary,
  traces,
  generatedAt
}) {
  const totalStepsObserved = traces.filter((trace) => trace.trace_event_type === "noop_dry_run_step_observed").length;
  return {
    strategy_dry_run_noop_summary_id: strategyDryRunNoopSummaryId({
      strategyDryRunReadinessCheckpointId: readinessCheckpoint.strategy_dry_run_readiness_checkpoint_id,
      strategyDryRunPlanId: dryRunPlan.strategy_dry_run_plan_id,
      totalTraceRecords: traces.length,
      totalStepsObserved,
      readinessStatus: readinessCheckpoint.readiness_status
    }),
    schema_version: "strategy_dry_run_noop_summary.v1",
    generated_at: generatedAt ?? readinessCheckpoint.generated_at,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    strategy_dry_run_readiness_checkpoint_id: readinessCheckpoint.strategy_dry_run_readiness_checkpoint_id,
    strategy_dry_run_plan_id: dryRunPlan.strategy_dry_run_plan_id,
    strategy_dry_run_plan_evidence_summary_id: dryRunPlanEvidenceSummary.strategy_dry_run_plan_evidence_summary_id,
    source_strategy_definition_id: readinessCheckpoint.strategy_definition_id,
    source_strategy_run_intent_id: readinessCheckpoint.strategy_run_intent_id,
    source_strategy_run_manifest_id: readinessCheckpoint.strategy_run_manifest_id,
    source_strategy_run_evidence_bundle_id: readinessCheckpoint.strategy_run_evidence_bundle_id,
    replay_mode: dryRunPlan.replay_mode,
    run_mode: dryRunPlan.run_mode,
    total_trace_records: traces.length,
    total_steps_observed: totalStepsObserved,
    readiness_status: readinessCheckpoint.readiness_status,
    status: "dry_run_noop_summary_ready",
    reason: "No-op dry-run summary only. No strategy logic, signals, decisions, trades, recommendations, analytics, or bankroll actions produced."
  };
}

function makeTrace({
  readinessCheckpoint,
  dryRunPlan,
  dryRunPlanEvidenceSummary,
  generatedAt,
  traceIndex,
  traceEventType,
  plannedObservationStep,
  observedArtifactType,
  observedArtifactRef,
  reason
}) {
  return {
    strategy_dry_run_trace_id: strategyDryRunTraceId({
      strategyDryRunReadinessCheckpointId: readinessCheckpoint.strategy_dry_run_readiness_checkpoint_id,
      traceIndex,
      traceEventType,
      plannedObservationStepType: plannedObservationStep?.step_type ?? "dry_run_boundary",
      observedArtifactRef
    }),
    schema_version: "strategy_dry_run_trace.v1",
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    strategy_dry_run_readiness_checkpoint_id: readinessCheckpoint.strategy_dry_run_readiness_checkpoint_id,
    strategy_dry_run_plan_id: dryRunPlan.strategy_dry_run_plan_id,
    strategy_dry_run_plan_evidence_summary_id: dryRunPlanEvidenceSummary.strategy_dry_run_plan_evidence_summary_id,
    strategy_definition_id: dryRunPlan.strategy_definition_id,
    strategy_run_intent_id: dryRunPlan.strategy_run_intent_id,
    source_strategy_definition_id: readinessCheckpoint.strategy_definition_id,
    source_strategy_run_intent_id: readinessCheckpoint.strategy_run_intent_id,
    source_strategy_run_manifest_id: readinessCheckpoint.strategy_run_manifest_id,
    source_strategy_run_evidence_bundle_id: readinessCheckpoint.strategy_run_evidence_bundle_id,
    replay_mode: dryRunPlan.replay_mode,
    run_mode: dryRunPlan.run_mode,
    trace_event_type: traceEventType,
    trace_index: traceIndex,
    planned_observation_step: plannedObservationStep,
    observed_artifact_type: observedArtifactType,
    observed_artifact_ref: observedArtifactRef,
    status: "dry_run_trace_recorded",
    reason
  };
}
