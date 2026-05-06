import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { replayRunReportId } from "./replay-run-report-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "replay-engine", "fixtures", "synthetic_replay_run_report.json");
const requiredFields = [
  "replay_run_report_id",
  "schema_version",
  "generated_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "replay_mode",
  "source_replay_evidence_bundle_id",
  "source_replay_run_manifest_id",
  "source_replay_clock_id",
  "source_replay_read_plan_id",
  "source_replay_noop_run_summary_id",
  "total_artifacts_verified",
  "total_trace_records",
  "total_records_read",
  "total_artifacts_read",
  "consistency_status",
  "status",
  "reason"
];
const allowedStatuses = new Set(["replay_run_report_ready", "replay_run_report_rejected"]);
const allowedConsistencyStatuses = new Set(["consistency_passed", "consistency_failed", "consistency_not_applicable"]);
const forbiddenReplayFields = new Set([
  "execute",
  "execution_plan",
  "strategy_score",
  "strategy_name",
  "bankroll_growth",
  "bankroll_allocation",
  "roi",
  "sharpe_ratio",
  "kelly_fraction",
  "model_score",
  "recommendation",
  "recommended_action",
  "live_trade_recommendation",
  "order",
  "order_id",
  "order_request",
  "trade_request",
  "signal_request",
  "decision_request",
  "analytics",
  "strategy_analytics"
]);
const expectedTotals = {
  total_artifacts_verified: 5,
  total_trace_records: 20,
  total_records_read: 18,
  total_artifacts_read: 8
};

export async function validateReplayRunReportFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let reportRecord;
  try {
    reportRecord = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, validateReplayRunReport(reportRecord).errors);
}

export function validateReplayRunReport(reportRecord) {
  const errors = [];

  if (!reportRecord || typeof reportRecord !== "object" || Array.isArray(reportRecord)) {
    return { ok: false, errors: ["ReplayRunReport must be a JSON object"] };
  }
  validateForbiddenFields(errors, reportRecord);
  for (const field of requiredFields) {
    if (!Object.hasOwn(reportRecord, field)) {
      errors.push(`${field} is required`);
    }
  }
  if (reportRecord.schema_version !== "replay_run_report.v1") {
    errors.push("schema_version must be replay_run_report.v1");
  }
  if (Number.isNaN(Date.parse(reportRecord.generated_at))) {
    errors.push("generated_at must be a valid timestamp");
  }
  if (reportRecord.paper_only !== true) {
    errors.push("paper_only must be true");
  }
  if (reportRecord.live_execution_allowed !== false) {
    errors.push("live_execution_allowed must be false");
  }
  if (reportRecord.order_placement_allowed !== false) {
    errors.push("order_placement_allowed must be false");
  }
  if (reportRecord.replay_mode !== "offline_fixture_replay") {
    errors.push("replay_mode is invalid");
  }
  if (!allowedConsistencyStatuses.has(reportRecord.consistency_status)) {
    errors.push("consistency_status is invalid");
  }
  if (!allowedStatuses.has(reportRecord.status)) {
    errors.push("status is invalid");
  }
  for (const field of ["total_artifacts_verified", "total_trace_records", "total_records_read", "total_artifacts_read"]) {
    if (!Number.isInteger(reportRecord[field]) || reportRecord[field] < 0) {
      errors.push(`${field} must be a non-negative integer`);
    }
    if (Number.isInteger(reportRecord[field]) && reportRecord[field] !== expectedTotals[field]) {
      errors.push(`${field} must match the local no-op replay evidence fixture`);
    }
  }
  if (reportRecord.replay_run_report_id !== replayRunReportId({
    evidenceBundleId: reportRecord.source_replay_evidence_bundle_id,
    totalTraceRecords: reportRecord.total_trace_records,
    totalRecordsRead: reportRecord.total_records_read,
    totalArtifactsRead: reportRecord.total_artifacts_read
  })) {
    errors.push("replay_run_report_id must be deterministic from source evidence bundle and totals");
  }
  if (Number.isInteger(reportRecord.total_trace_records) && Number.isInteger(reportRecord.total_records_read)) {
    if (reportRecord.total_trace_records !== reportRecord.total_records_read + 2) {
      errors.push("total_trace_records must equal total_records_read plus no-op boundary traces");
    }
  }
  if (reportRecord.consistency_status === "consistency_passed" && reportRecord.status !== "replay_run_report_ready") {
    errors.push("consistency_passed replay reports must use replay_run_report_ready status");
  }
  if (["consistency_failed", "consistency_not_applicable"].includes(reportRecord.consistency_status) && reportRecord.status !== "replay_run_report_rejected") {
    errors.push("non-passed replay reports must use replay_run_report_rejected status");
  }
  if (reportRecord.status === "replay_run_report_ready" && reportRecord.consistency_status !== "consistency_passed") {
    errors.push("ready replay reports must use consistency_passed");
  }

  return { ok: errors.length === 0, errors };
}

export function formatReplayRunReportValidationReport(report) {
  const lines = [
    "Overlord ReplayRunReport Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) {
    lines.push(`ERROR ${error}`);
  }
  return lines.join("\n");
}

function validateForbiddenFields(errors, value, pathParts = []) {
  if (!value || typeof value !== "object") {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => validateForbiddenFields(errors, entry, [...pathParts, String(index)]));
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenReplayFields.has(key)) {
      const fieldPath = [...pathParts, key].join(".");
      errors.push(`forbidden execution, strategy, bankroll, model, or recommendation field is not allowed: ${fieldPath}`);
    }
    validateForbiddenFields(errors, nested, [...pathParts, key]);
  }
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
  const report = await validateReplayRunReportFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatReplayRunReportValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
