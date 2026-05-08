import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { validateForbiddenFields } from "./strategy-contract-rules.js";
import { strategyDryRunCaseFileSummaryId } from "./strategy-dry-run-case-file-summary-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_dry_run_case_file_summary.json");
const requiredFields = [
  "strategy_dry_run_case_file_summary_id",
  "schema_version",
  "generated_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "strategy_dry_run_evidence_bundle_id",
  "strategy_dry_run_readiness_checkpoint_id",
  "strategy_dry_run_plan_id",
  "strategy_dry_run_plan_evidence_summary_id",
  "strategy_dry_run_noop_summary_id",
  "replay_mode",
  "run_mode",
  "total_evidence_artifacts",
  "total_trace_records",
  "total_steps_observed",
  "readiness_status",
  "consistency_status",
  "status",
  "reason"
];
const allowedRunModes = new Set(["validation_only", "dry_run_planned"]);
const allowedReadinessStatuses = new Set(["dry_run_ready", "dry_run_not_ready", "dry_run_readiness_unknown"]);
const allowedConsistencyStatuses = new Set(["consistency_passed", "consistency_failed", "consistency_not_applicable"]);
const allowedStatuses = new Set(["dry_run_case_file_summary_ready", "dry_run_case_file_summary_rejected"]);

export async function validateStrategyDryRunCaseFileSummaryFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let summary;
  try {
    summary = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, validateStrategyDryRunCaseFileSummary(summary).errors);
}

export function validateStrategyDryRunCaseFileSummary(summary) {
  const errors = [];

  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    return { ok: false, errors: ["StrategyDryRunCaseFileSummary must be a JSON object"] };
  }
  validateForbiddenFields(errors, summary);
  for (const field of requiredFields) {
    if (!Object.hasOwn(summary, field)) errors.push(`${field} is required`);
  }
  validateCoreFields(errors, summary);
  validateIdShapes(errors, summary);
  validateDeterministicId(errors, summary);

  return { ok: errors.length === 0, errors };
}

export function formatStrategyDryRunCaseFileSummaryValidationReport(report) {
  const lines = [
    "Overlord StrategyDryRunCaseFileSummary Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) lines.push(`ERROR ${error}`);
  return lines.join("\n");
}

function validateCoreFields(errors, summary) {
  if (summary.schema_version !== "strategy_dry_run_case_file_summary.v1") errors.push("schema_version must be strategy_dry_run_case_file_summary.v1");
  if (Number.isNaN(Date.parse(summary.generated_at))) errors.push("generated_at must be a valid timestamp");
  if (summary.paper_only !== true) errors.push("paper_only must be true");
  if (summary.live_execution_allowed !== false) errors.push("live_execution_allowed must be false");
  if (summary.order_placement_allowed !== false) errors.push("order_placement_allowed must be false");
  if (summary.replay_mode !== "offline_fixture_replay") errors.push("replay_mode is invalid");
  if (!allowedRunModes.has(summary.run_mode)) errors.push("run_mode is invalid");
  if (!allowedReadinessStatuses.has(summary.readiness_status)) errors.push("readiness_status is invalid");
  if (!allowedConsistencyStatuses.has(summary.consistency_status)) errors.push("consistency_status is invalid");
  if (!allowedStatuses.has(summary.status)) errors.push("status is invalid");
  for (const field of ["total_evidence_artifacts", "total_trace_records", "total_steps_observed"]) {
    if (!Number.isInteger(summary[field]) || summary[field] < 0) errors.push(`${field} must be a non-negative integer`);
  }
  if (Number.isInteger(summary.total_trace_records) && Number.isInteger(summary.total_steps_observed) && summary.total_trace_records !== summary.total_steps_observed + 2) {
    errors.push("total_trace_records must equal total_steps_observed plus start and completed trace records");
  }
  if (summary.total_evidence_artifacts !== 5) errors.push("total_evidence_artifacts must equal the dry-run evidence artifact contract count");
  if (summary.status === "dry_run_case_file_summary_ready" && summary.consistency_status !== "consistency_passed") {
    errors.push("ready dry-run case-file summaries require consistency_passed");
  }
}

function validateIdShapes(errors, summary) {
  if (typeof summary.strategy_dry_run_case_file_summary_id !== "string" || !summary.strategy_dry_run_case_file_summary_id.startsWith("sdrcfs_")) errors.push("strategy_dry_run_case_file_summary_id must reference a StrategyDryRunCaseFileSummary id");
  if (typeof summary.strategy_dry_run_evidence_bundle_id !== "string" || !summary.strategy_dry_run_evidence_bundle_id.startsWith("sdreb_")) errors.push("strategy_dry_run_evidence_bundle_id must reference a StrategyDryRunEvidenceBundle id");
  if (typeof summary.strategy_dry_run_readiness_checkpoint_id !== "string" || !summary.strategy_dry_run_readiness_checkpoint_id.startsWith("sdrpc_")) errors.push("strategy_dry_run_readiness_checkpoint_id must reference a StrategyDryRunReadinessCheckpoint id");
  if (typeof summary.strategy_dry_run_plan_id !== "string" || !summary.strategy_dry_run_plan_id.startsWith("sdrp_")) errors.push("strategy_dry_run_plan_id must reference a StrategyDryRunPlan id");
  if (typeof summary.strategy_dry_run_plan_evidence_summary_id !== "string" || !summary.strategy_dry_run_plan_evidence_summary_id.startsWith("sdrpes_")) errors.push("strategy_dry_run_plan_evidence_summary_id must reference a StrategyDryRunPlanEvidenceSummary id");
  if (typeof summary.strategy_dry_run_noop_summary_id !== "string" || !summary.strategy_dry_run_noop_summary_id.startsWith("sdrns_")) errors.push("strategy_dry_run_noop_summary_id must reference a StrategyDryRunNoOpSummary id");
}

function validateDeterministicId(errors, summary) {
  const expected = strategyDryRunCaseFileSummaryId({
    strategyDryRunEvidenceBundleId: summary.strategy_dry_run_evidence_bundle_id,
    strategyDryRunReadinessCheckpointId: summary.strategy_dry_run_readiness_checkpoint_id,
    strategyDryRunPlanId: summary.strategy_dry_run_plan_id,
    totalEvidenceArtifacts: summary.total_evidence_artifacts,
    totalTraceRecords: summary.total_trace_records,
    totalStepsObserved: summary.total_steps_observed,
    consistencyStatus: summary.consistency_status
  });
  if (summary.strategy_dry_run_case_file_summary_id !== expected) {
    errors.push("strategy_dry_run_case_file_summary_id must be deterministic from evidence bundle, dry-run ids, totals, and consistency status");
  }
}

function makeReport(filePath, errors) {
  return { ok: errors.length === 0, filePath: path.relative(repoRoot, filePath).replaceAll("\\", "/"), errors };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const explicitPath = process.argv.find((arg) => arg.endsWith(".json"));
  const report = await validateStrategyDryRunCaseFileSummaryFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatStrategyDryRunCaseFileSummaryValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
