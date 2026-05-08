import path from "node:path";
import { readJson } from "./strategy-run-artifacts.js";
import { strategyDryRunPlanEvidenceSummaryId } from "./strategy-dry-run-plan-evidence-summary-id.js";
import { validateStrategyDryRunPlan } from "./validate-strategy-dry-run-plan.js";

const defaultPlanPath = "packages/strategy-dsl/fixtures/synthetic_strategy_dry_run_plan.json";

export async function buildStrategyDryRunPlanEvidenceSummary(options = {}) {
  const repoRoot = options.repoRoot ?? path.resolve(import.meta.dirname, "..", "..", "..");
  const generatedAt = options.generatedAt ?? "2026-04-28T14:05:03Z";
  const planPath = options.planPath ?? defaultPlanPath;
  const plan = options.plan ?? await readJson(repoRoot, planPath);
  const validationReport = options.validationReport ?? await validateStrategyDryRunPlan(plan, { repoRoot });
  const validationStatus = validationReport.ok ? "validation_passed" : "validation_failed";
  const counts = {
    allowedInputArtifactCount: Array.isArray(plan.allowed_input_artifacts) ? plan.allowed_input_artifacts.length : 0,
    forbiddenOutputCount: Array.isArray(plan.forbidden_outputs) ? plan.forbidden_outputs.length : 0,
    plannedObservationStepCount: Array.isArray(plan.planned_observation_steps) ? plan.planned_observation_steps.length : 0,
    safetyConstraintCount: Array.isArray(plan.safety_constraints) ? plan.safety_constraints.length : 0
  };

  return {
    strategy_dry_run_plan_evidence_summary_id: strategyDryRunPlanEvidenceSummaryId({
      strategyDryRunPlanId: plan.strategy_dry_run_plan_id,
      validationStatus,
      ...counts,
      generatedAt
    }),
    schema_version: "strategy_dry_run_plan_evidence_summary.v1",
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    strategy_dry_run_plan_id: plan.strategy_dry_run_plan_id,
    strategy_definition_id: plan.strategy_definition_id,
    strategy_run_intent_id: plan.strategy_run_intent_id,
    strategy_run_manifest_id: plan.strategy_run_manifest_id,
    strategy_run_evidence_bundle_id: plan.strategy_run_evidence_bundle_id,
    source_strategy_dry_run_plan_id: plan.strategy_dry_run_plan_id,
    source_strategy_definition_id: plan.source_strategy_definition_id,
    source_strategy_run_intent_id: plan.source_strategy_run_intent_id,
    source_strategy_run_manifest_id: plan.source_strategy_run_manifest_id,
    source_strategy_run_evidence_bundle_id: plan.source_strategy_run_evidence_bundle_id,
    replay_mode: plan.replay_mode,
    run_mode: plan.run_mode,
    allowed_input_artifact_count: counts.allowedInputArtifactCount,
    forbidden_output_count: counts.forbiddenOutputCount,
    planned_observation_step_count: counts.plannedObservationStepCount,
    safety_constraint_count: counts.safetyConstraintCount,
    validation_status: validationStatus,
    status: validationReport.ok ? "dry_run_plan_evidence_summary_ready" : "dry_run_plan_evidence_summary_rejected",
    reason: validationReport.ok
      ? "StrategyDryRunPlan validation passed and was inventoried without executing strategy logic."
      : "StrategyDryRunPlan validation failed; summary is rejected without executing strategy logic."
  };
}
