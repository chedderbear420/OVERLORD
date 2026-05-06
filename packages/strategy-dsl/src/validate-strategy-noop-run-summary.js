import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { validateForbiddenFields } from "./strategy-contract-rules.js";
import { strategyNoopRunSummaryId } from "./strategy-noop-run-summary-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_noop_run_summary.json");
const requiredFields = [
  "strategy_noop_run_summary_id",
  "schema_version",
  "generated_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "strategy_definition_id",
  "strategy_run_intent_id",
  "source_replay_run_manifest_id",
  "source_replay_evidence_bundle_id",
  "source_replay_clock_id",
  "source_replay_read_plan_id",
  "replay_mode",
  "run_mode",
  "total_trace_records",
  "total_inputs_observed",
  "status",
  "reason"
];
const allowedRunModes = new Set(["validation_only", "dry_run_planned"]);
const allowedStatuses = new Set(["strategy_noop_summary_ready", "strategy_noop_summary_rejected"]);

export async function validateStrategyNoopRunSummaryFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let summary;
  try {
    summary = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, validateStrategyNoopRunSummary(summary).errors);
}

export function validateStrategyNoopRunSummary(summary) {
  const errors = [];

  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    return { ok: false, errors: ["StrategyNoOpRunSummary must be a JSON object"] };
  }
  validateForbiddenFields(errors, summary);
  for (const field of requiredFields) {
    if (!Object.hasOwn(summary, field)) {
      errors.push(`${field} is required`);
    }
  }
  if (summary.schema_version !== "strategy_noop_run_summary.v1") {
    errors.push("schema_version must be strategy_noop_run_summary.v1");
  }
  if (Number.isNaN(Date.parse(summary.generated_at))) {
    errors.push("generated_at must be a valid timestamp");
  }
  if (summary.paper_only !== true) {
    errors.push("paper_only must be true");
  }
  if (summary.live_execution_allowed !== false) {
    errors.push("live_execution_allowed must be false");
  }
  if (summary.order_placement_allowed !== false) {
    errors.push("order_placement_allowed must be false");
  }
  if (typeof summary.strategy_definition_id !== "string" || !summary.strategy_definition_id.startsWith("sdef_")) {
    errors.push("strategy_definition_id must reference a StrategyDefinition id");
  }
  if (typeof summary.strategy_run_intent_id !== "string" || !summary.strategy_run_intent_id.startsWith("sri_")) {
    errors.push("strategy_run_intent_id must reference a StrategyRunIntent id");
  }
  if (typeof summary.source_replay_run_manifest_id !== "string" || !summary.source_replay_run_manifest_id.startsWith("rrm_")) {
    errors.push("source_replay_run_manifest_id must reference a ReplayRunManifest id");
  }
  if (typeof summary.source_replay_evidence_bundle_id !== "string" || !summary.source_replay_evidence_bundle_id.startsWith("reb_")) {
    errors.push("source_replay_evidence_bundle_id must reference a ReplayEvidenceBundle id");
  }
  if (typeof summary.source_replay_clock_id !== "string" || !summary.source_replay_clock_id.startsWith("rclk_")) {
    errors.push("source_replay_clock_id must reference a ReplayClock id");
  }
  if (typeof summary.source_replay_read_plan_id !== "string" || !summary.source_replay_read_plan_id.startsWith("rrp_")) {
    errors.push("source_replay_read_plan_id must reference a ReplayReadPlan id");
  }
  if (summary.replay_mode !== "offline_fixture_replay") {
    errors.push("replay_mode is invalid");
  }
  if (!allowedRunModes.has(summary.run_mode)) {
    errors.push("run_mode is invalid");
  }
  if (!allowedStatuses.has(summary.status)) {
    errors.push("status is invalid");
  }
  for (const field of ["total_trace_records", "total_inputs_observed"]) {
    if (!Number.isInteger(summary[field]) || summary[field] < 0) {
      errors.push(`${field} must be a non-negative integer`);
    }
  }
  if (summary.strategy_noop_run_summary_id !== strategyNoopRunSummaryId(
    summary.strategy_run_intent_id,
    summary.total_trace_records,
    summary.total_inputs_observed
  )) {
    errors.push("strategy_noop_run_summary_id must be deterministic from strategy run intent and trace totals");
  }
  if (summary.status === "strategy_noop_summary_ready" && summary.total_trace_records < 2) {
    errors.push("ready no-op strategy summaries must include start and completed trace records");
  }
  if (summary.status === "strategy_noop_summary_rejected" && summary.total_inputs_observed > 0) {
    errors.push("rejected no-op strategy summaries must not report inputs observed");
  }
  if (Number.isInteger(summary.total_trace_records) && Number.isInteger(summary.total_inputs_observed)) {
    if (summary.total_trace_records !== summary.total_inputs_observed + 2) {
      errors.push("total_trace_records must equal total_inputs_observed plus start and completed trace records");
    }
  }

  return { ok: errors.length === 0, errors };
}

export function formatStrategyNoopRunSummaryValidationReport(report) {
  const lines = [
    "Overlord StrategyNoOpRunSummary Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) {
    lines.push(`ERROR ${error}`);
  }
  return lines.join("\n");
}

function makeReport(filePath, errors) {
  return {
    ok: errors.length === 0,
    filePath: path.relative(repoRoot, filePath).replaceAll("\\", "/"),
    errors
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const explicitPath = process.argv.find((arg) => arg.endsWith(".json"));
  const report = await validateStrategyNoopRunSummaryFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatStrategyNoopRunSummaryValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
