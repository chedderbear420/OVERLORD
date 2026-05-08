import path from "node:path";
import {
  defaultStrategyDryRunArtifactPaths,
  readStrategyDryRunSources,
  strategyDryRunArtifactContracts
} from "./strategy-dry-run-artifacts.js";
import { strategyDryRunEvidenceBundleId } from "./strategy-dry-run-evidence-bundle-id.js";

export async function buildStrategyDryRunEvidenceBundle(options = {}) {
  const repoRoot = options.repoRoot ?? path.resolve(import.meta.dirname, "..", "..", "..");
  const generatedAt = options.generatedAt ?? "2026-04-28T14:05:05Z";
  const paths = { ...defaultStrategyDryRunArtifactPaths, ...options.paths };
  const sources = options.sources ?? await readStrategyDryRunSources(repoRoot, paths);
  const evidenceArtifacts = strategyDryRunArtifactContracts.map((contract) => makeEvidenceArtifact(contract, paths, sources));
  const consistencyChecks = buildStrategyDryRunEvidenceConsistencyChecks({ sources, evidenceArtifacts });
  const allChecksPassed = consistencyChecks.every((check) => check.status === "check_passed");

  return {
    strategy_dry_run_evidence_bundle_id: strategyDryRunEvidenceBundleId({
      strategyDryRunReadinessCheckpointId: sources.readinessCheckpoint.strategy_dry_run_readiness_checkpoint_id,
      strategyDryRunPlanId: sources.dryRunPlan.strategy_dry_run_plan_id,
      strategyDryRunPlanEvidenceSummaryId: sources.dryRunPlanEvidenceSummary.strategy_dry_run_plan_evidence_summary_id,
      strategyDryRunNoopSummaryId: sources.dryRunNoopSummary.strategy_dry_run_noop_summary_id,
      traceCount: sources.dryRunTraces.length
    }),
    schema_version: "strategy_dry_run_evidence_bundle.v1",
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    strategy_dry_run_readiness_checkpoint_id: sources.readinessCheckpoint.strategy_dry_run_readiness_checkpoint_id,
    strategy_dry_run_plan_id: sources.dryRunPlan.strategy_dry_run_plan_id,
    strategy_dry_run_plan_evidence_summary_id: sources.dryRunPlanEvidenceSummary.strategy_dry_run_plan_evidence_summary_id,
    strategy_dry_run_noop_summary_id: sources.dryRunNoopSummary.strategy_dry_run_noop_summary_id,
    strategy_definition_id: sources.dryRunPlan.strategy_definition_id,
    strategy_run_intent_id: sources.dryRunPlan.strategy_run_intent_id,
    source_strategy_dry_run_readiness_checkpoint_id: sources.readinessCheckpoint.strategy_dry_run_readiness_checkpoint_id,
    source_strategy_dry_run_plan_id: sources.dryRunPlan.strategy_dry_run_plan_id,
    source_strategy_dry_run_plan_evidence_summary_id: sources.dryRunPlanEvidenceSummary.strategy_dry_run_plan_evidence_summary_id,
    source_strategy_dry_run_noop_summary_id: sources.dryRunNoopSummary.strategy_dry_run_noop_summary_id,
    source_strategy_definition_id: sources.dryRunPlan.strategy_definition_id,
    source_strategy_run_intent_id: sources.dryRunPlan.strategy_run_intent_id,
    replay_mode: sources.dryRunPlan.replay_mode,
    run_mode: sources.dryRunPlan.run_mode,
    evidence_artifacts: evidenceArtifacts,
    consistency_checks: consistencyChecks,
    status: allChecksPassed ? "dry_run_evidence_bundle_ready" : "dry_run_evidence_bundle_rejected",
    reason: "Strategy dry-run evidence bundle for local no-op dry-run only. No strategy logic, signals, decisions, trades, recommendations, analytics, or bankroll actions produced."
  };
}

export function buildStrategyDryRunEvidenceConsistencyChecks({ sources, evidenceArtifacts }) {
  return [
    makeCheck("readiness_checkpoint_id_alignment", sources.dryRunTraces.every((trace) => trace.strategy_dry_run_readiness_checkpoint_id === sources.readinessCheckpoint.strategy_dry_run_readiness_checkpoint_id)
      && sources.dryRunNoopSummary.strategy_dry_run_readiness_checkpoint_id === sources.readinessCheckpoint.strategy_dry_run_readiness_checkpoint_id),
    makeCheck("dry_run_plan_id_alignment", sources.readinessCheckpoint.strategy_dry_run_plan_id === sources.dryRunPlan.strategy_dry_run_plan_id
      && sources.dryRunPlanEvidenceSummary.strategy_dry_run_plan_id === sources.dryRunPlan.strategy_dry_run_plan_id
      && sources.dryRunTraces.every((trace) => trace.strategy_dry_run_plan_id === sources.dryRunPlan.strategy_dry_run_plan_id)
      && sources.dryRunNoopSummary.strategy_dry_run_plan_id === sources.dryRunPlan.strategy_dry_run_plan_id),
    makeCheck("dry_run_plan_evidence_summary_id_alignment", sources.readinessCheckpoint.strategy_dry_run_plan_evidence_summary_id === sources.dryRunPlanEvidenceSummary.strategy_dry_run_plan_evidence_summary_id
      && sources.dryRunTraces.every((trace) => trace.strategy_dry_run_plan_evidence_summary_id === sources.dryRunPlanEvidenceSummary.strategy_dry_run_plan_evidence_summary_id)
      && sources.dryRunNoopSummary.strategy_dry_run_plan_evidence_summary_id === sources.dryRunPlanEvidenceSummary.strategy_dry_run_plan_evidence_summary_id),
    makeCheck("dry_run_noop_summary_id_alignment", typeof sources.dryRunNoopSummary.strategy_dry_run_noop_summary_id === "string"
      && sources.dryRunNoopSummary.strategy_dry_run_noop_summary_id.startsWith("sdrns_")),
    makeCheck("trace_record_total_alignment", sources.dryRunTraces.length === sources.dryRunNoopSummary.total_trace_records),
    makeCheck("observed_step_total_alignment", sources.dryRunTraces.filter((trace) => trace.trace_event_type === "noop_dry_run_step_observed").length === sources.dryRunNoopSummary.total_steps_observed),
    makeCheck("evidence_artifact_contract_count", evidenceArtifacts.length === strategyDryRunArtifactContracts.length)
  ];
}

function makeEvidenceArtifact(contract, paths, sources) {
  const source = {
    strategy_dry_run_readiness_checkpoint: sources.readinessCheckpoint,
    strategy_dry_run_plan: sources.dryRunPlan,
    strategy_dry_run_plan_evidence_summary: sources.dryRunPlanEvidenceSummary,
    strategy_dry_run_noop_summary: sources.dryRunNoopSummary
  }[contract.artifact_type];
  return {
    artifact_type: contract.artifact_type,
    artifact_path: paths[contract.pathKey],
    schema_version: contract.schema_version,
    record_count: contract.artifact_type === "strategy_dry_run_trace" ? sources.dryRunTraces.length : 1,
    validation_command: contract.validation_command,
    artifact_id: contract.id_field ? source[contract.id_field] : null
  };
}

function makeCheck(checkName, passed) {
  return {
    check_name: checkName,
    status: passed ? "check_passed" : "check_failed",
    reason: passed ? `${checkName} passed.` : `${checkName} failed.`
  };
}
