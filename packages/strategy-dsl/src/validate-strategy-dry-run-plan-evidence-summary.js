import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { validateForbiddenFields } from "./strategy-contract-rules.js";
import { readJson } from "./strategy-run-artifacts.js";
import { strategyDryRunPlanEvidenceSummaryId } from "./strategy-dry-run-plan-evidence-summary-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_dry_run_plan_evidence_summary.json");
const defaultSourcePlanPath = "packages/strategy-dsl/fixtures/synthetic_strategy_dry_run_plan.json";
const requiredFields = [
  "strategy_dry_run_plan_evidence_summary_id",
  "schema_version",
  "generated_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "strategy_dry_run_plan_id",
  "strategy_definition_id",
  "strategy_run_intent_id",
  "strategy_run_manifest_id",
  "strategy_run_evidence_bundle_id",
  "source_strategy_dry_run_plan_id",
  "source_strategy_definition_id",
  "source_strategy_run_intent_id",
  "source_strategy_run_manifest_id",
  "source_strategy_run_evidence_bundle_id",
  "replay_mode",
  "run_mode",
  "allowed_input_artifact_count",
  "forbidden_output_count",
  "planned_observation_step_count",
  "safety_constraint_count",
  "validation_status",
  "status",
  "reason"
];
const allowedRunModes = new Set(["validation_only", "dry_run_planned"]);
const allowedReplayModes = new Set(["offline_fixture_replay"]);
const allowedValidationStatuses = new Set(["validation_passed", "validation_failed", "validation_not_applicable"]);
const allowedStatuses = new Set(["dry_run_plan_evidence_summary_ready", "dry_run_plan_evidence_summary_rejected"]);

export async function validateStrategyDryRunPlanEvidenceSummaryFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let summary;
  try {
    summary = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, (await validateStrategyDryRunPlanEvidenceSummary(summary, options)).errors);
}

export async function validateStrategyDryRunPlanEvidenceSummary(summary, options = {}) {
  const errors = [];
  const root = options.repoRoot ?? repoRoot;

  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    return { ok: false, errors: ["StrategyDryRunPlanEvidenceSummary must be a JSON object"] };
  }
  validateForbiddenFields(errors, summary);
  for (const field of requiredFields) {
    if (!Object.hasOwn(summary, field)) errors.push(`${field} is required`);
  }
  validateCoreFields(errors, summary);
  validateIdShapes(errors, summary);
  validateCounts(errors, summary);
  validateDeterministicId(errors, summary);
  await validateAgainstSourcePlan(errors, root, summary, options);

  return { ok: errors.length === 0, errors };
}

export function formatStrategyDryRunPlanEvidenceSummaryValidationReport(report) {
  const lines = [
    "Overlord StrategyDryRunPlanEvidenceSummary Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) lines.push(`ERROR ${error}`);
  return lines.join("\n");
}

function validateCoreFields(errors, summary) {
  if (summary.schema_version !== "strategy_dry_run_plan_evidence_summary.v1") errors.push("schema_version must be strategy_dry_run_plan_evidence_summary.v1");
  if (Number.isNaN(Date.parse(summary.generated_at))) errors.push("generated_at must be a valid timestamp");
  if (summary.paper_only !== true) errors.push("paper_only must be true");
  if (summary.live_execution_allowed !== false) errors.push("live_execution_allowed must be false");
  if (summary.order_placement_allowed !== false) errors.push("order_placement_allowed must be false");
  if (!allowedReplayModes.has(summary.replay_mode)) errors.push("replay_mode is invalid");
  if (!allowedRunModes.has(summary.run_mode)) errors.push("run_mode is invalid");
  if (!allowedValidationStatuses.has(summary.validation_status)) errors.push("validation_status is invalid");
  if (!allowedStatuses.has(summary.status)) errors.push("status is invalid");
  if (summary.status === "dry_run_plan_evidence_summary_ready" && summary.validation_status !== "validation_passed") {
    errors.push("ready StrategyDryRunPlanEvidenceSummary requires validation_passed");
  }
  if (summary.validation_status === "validation_failed" && summary.status !== "dry_run_plan_evidence_summary_rejected") {
    errors.push("validation_failed StrategyDryRunPlanEvidenceSummary requires rejected status");
  }
}

function validateIdShapes(errors, summary) {
  if (typeof summary.strategy_dry_run_plan_id !== "string" || !summary.strategy_dry_run_plan_id.startsWith("sdrp_")) errors.push("strategy_dry_run_plan_id must reference a StrategyDryRunPlan id");
  if (typeof summary.strategy_definition_id !== "string" || !summary.strategy_definition_id.startsWith("sdef_")) errors.push("strategy_definition_id must reference a StrategyDefinition id");
  if (typeof summary.strategy_run_intent_id !== "string" || !summary.strategy_run_intent_id.startsWith("sri_")) errors.push("strategy_run_intent_id must reference a StrategyRunIntent id");
  if (typeof summary.strategy_run_manifest_id !== "string" || !summary.strategy_run_manifest_id.startsWith("srm_")) errors.push("strategy_run_manifest_id must reference a StrategyRunManifest id");
  if (typeof summary.strategy_run_evidence_bundle_id !== "string" || !summary.strategy_run_evidence_bundle_id.startsWith("sreb_")) errors.push("strategy_run_evidence_bundle_id must reference a StrategyRunEvidenceBundle id");
  if (summary.source_strategy_dry_run_plan_id !== summary.strategy_dry_run_plan_id) errors.push("source_strategy_dry_run_plan_id must match strategy_dry_run_plan_id");
  if (summary.source_strategy_definition_id !== summary.strategy_definition_id) errors.push("source_strategy_definition_id must match strategy_definition_id");
  if (summary.source_strategy_run_intent_id !== summary.strategy_run_intent_id) errors.push("source_strategy_run_intent_id must match strategy_run_intent_id");
  if (summary.source_strategy_run_manifest_id !== summary.strategy_run_manifest_id) errors.push("source_strategy_run_manifest_id must match strategy_run_manifest_id");
  if (summary.source_strategy_run_evidence_bundle_id !== summary.strategy_run_evidence_bundle_id) errors.push("source_strategy_run_evidence_bundle_id must match strategy_run_evidence_bundle_id");
}

function validateCounts(errors, summary) {
  for (const field of ["allowed_input_artifact_count", "forbidden_output_count", "planned_observation_step_count", "safety_constraint_count"]) {
    if (!Number.isInteger(summary[field]) || summary[field] < 0) errors.push(`${field} must be a non-negative integer`);
  }
}

function validateDeterministicId(errors, summary) {
  const expected = strategyDryRunPlanEvidenceSummaryId({
    strategyDryRunPlanId: summary.strategy_dry_run_plan_id,
    validationStatus: summary.validation_status,
    allowedInputArtifactCount: summary.allowed_input_artifact_count,
    forbiddenOutputCount: summary.forbidden_output_count,
    plannedObservationStepCount: summary.planned_observation_step_count,
    safetyConstraintCount: summary.safety_constraint_count,
    generatedAt: summary.generated_at
  });
  if (summary.strategy_dry_run_plan_evidence_summary_id !== expected) {
    errors.push("strategy_dry_run_plan_evidence_summary_id must be deterministic from source plan id, validation status, counts, and generated_at");
  }
}

async function validateAgainstSourcePlan(errors, root, summary, options) {
  if (options.skipSourcePlanCheck === true) return;
  let plan;
  try {
    plan = options.sourcePlan ?? await readJson(root, options.sourcePlanPath ?? defaultSourcePlanPath);
  } catch (error) {
    errors.push(`source StrategyDryRunPlan could not be read: ${error.message}`);
    return;
  }
  if (summary.strategy_dry_run_plan_id !== plan.strategy_dry_run_plan_id) errors.push("strategy_dry_run_plan_id must match source StrategyDryRunPlan");
  if (summary.strategy_definition_id !== plan.strategy_definition_id) errors.push("strategy_definition_id must match source StrategyDryRunPlan");
  if (summary.strategy_run_intent_id !== plan.strategy_run_intent_id) errors.push("strategy_run_intent_id must match source StrategyDryRunPlan");
  if (summary.strategy_run_manifest_id !== plan.strategy_run_manifest_id) errors.push("strategy_run_manifest_id must match source StrategyDryRunPlan");
  if (summary.strategy_run_evidence_bundle_id !== plan.strategy_run_evidence_bundle_id) errors.push("strategy_run_evidence_bundle_id must match source StrategyDryRunPlan");
  if (summary.allowed_input_artifact_count !== countArray(plan.allowed_input_artifacts)) errors.push("allowed_input_artifact_count must match source StrategyDryRunPlan");
  if (summary.forbidden_output_count !== countArray(plan.forbidden_outputs)) errors.push("forbidden_output_count must match source StrategyDryRunPlan");
  if (summary.planned_observation_step_count !== countArray(plan.planned_observation_steps)) errors.push("planned_observation_step_count must match source StrategyDryRunPlan");
  if (summary.safety_constraint_count !== countArray(plan.safety_constraints)) errors.push("safety_constraint_count must match source StrategyDryRunPlan");
}

function countArray(value) {
  return Array.isArray(value) ? value.length : 0;
}

function makeReport(filePath, errors) {
  return { ok: errors.length === 0, filePath: path.relative(repoRoot, filePath).replaceAll("\\", "/"), errors };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const explicitPath = process.argv.find((arg) => arg.endsWith(".json"));
  const report = await validateStrategyDryRunPlanEvidenceSummaryFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatStrategyDryRunPlanEvidenceSummaryValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
