import path from "node:path";
import { defaultStrategyDryRunArtifactPaths, readJson } from "./strategy-dry-run-artifacts.js";
import { buildStrategyDryRunEvidenceBundle } from "./build-strategy-dry-run-evidence-bundle.js";
import { strategyDryRunCaseFileSummaryId } from "./strategy-dry-run-case-file-summary-id.js";

export async function buildStrategyDryRunCaseFileSummary(options = {}) {
  const repoRoot = options.repoRoot ?? path.resolve(import.meta.dirname, "..", "..", "..");
  const generatedAt = options.generatedAt ?? "2026-04-28T14:05:05Z";
  const paths = { ...defaultStrategyDryRunArtifactPaths, ...options.paths };
  const evidenceBundle = options.evidenceBundle ?? await buildStrategyDryRunEvidenceBundle({ repoRoot, generatedAt, paths });
  const dryRunNoopSummary = options.dryRunNoopSummary ?? await readJson(repoRoot, paths.dryRunNoopSummaryPath);
  const consistencyStatus = evidenceBundle.consistency_checks.every((check) => check.status === "check_passed")
    ? "consistency_passed"
    : "consistency_failed";

  return {
    strategy_dry_run_case_file_summary_id: strategyDryRunCaseFileSummaryId({
      strategyDryRunEvidenceBundleId: evidenceBundle.strategy_dry_run_evidence_bundle_id,
      strategyDryRunReadinessCheckpointId: evidenceBundle.strategy_dry_run_readiness_checkpoint_id,
      strategyDryRunPlanId: evidenceBundle.strategy_dry_run_plan_id,
      totalEvidenceArtifacts: evidenceBundle.evidence_artifacts.length,
      totalTraceRecords: dryRunNoopSummary.total_trace_records,
      totalStepsObserved: dryRunNoopSummary.total_steps_observed,
      consistencyStatus
    }),
    schema_version: "strategy_dry_run_case_file_summary.v1",
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    strategy_dry_run_evidence_bundle_id: evidenceBundle.strategy_dry_run_evidence_bundle_id,
    strategy_dry_run_readiness_checkpoint_id: evidenceBundle.strategy_dry_run_readiness_checkpoint_id,
    strategy_dry_run_plan_id: evidenceBundle.strategy_dry_run_plan_id,
    strategy_dry_run_plan_evidence_summary_id: evidenceBundle.strategy_dry_run_plan_evidence_summary_id,
    strategy_dry_run_noop_summary_id: evidenceBundle.strategy_dry_run_noop_summary_id,
    replay_mode: evidenceBundle.replay_mode,
    run_mode: evidenceBundle.run_mode,
    total_evidence_artifacts: evidenceBundle.evidence_artifacts.length,
    total_trace_records: dryRunNoopSummary.total_trace_records,
    total_steps_observed: dryRunNoopSummary.total_steps_observed,
    readiness_status: dryRunNoopSummary.readiness_status,
    consistency_status: consistencyStatus,
    status: consistencyStatus === "consistency_passed" ? "dry_run_case_file_summary_ready" : "dry_run_case_file_summary_rejected",
    reason: "Strategy dry-run case-file summary for local no-op dry-run evidence only. No strategy logic, signals, decisions, trades, recommendations, analytics, or bankroll actions produced."
  };
}
