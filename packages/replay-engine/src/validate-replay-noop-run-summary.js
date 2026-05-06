import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { replayNoopRunSummaryId } from "./replay-noop-run-summary-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "replay-engine", "fixtures", "synthetic_replay_noop_run_summary.json");
const requiredFields = [
  "replay_noop_run_summary_id",
  "schema_version",
  "generated_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "replay_mode",
  "source_replay_run_manifest_id",
  "source_replay_clock_id",
  "source_replay_read_plan_id",
  "total_trace_records",
  "total_records_read",
  "total_artifacts_read",
  "status",
  "reason"
];
const allowedStatuses = new Set(["noop_replay_summary_ready", "noop_replay_summary_rejected"]);
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
  "trade_request"
]);

export async function validateReplayNoopRunSummaryFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let summary;
  try {
    summary = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, validateReplayNoopRunSummary(summary).errors);
}

export function validateReplayNoopRunSummary(summary) {
  const errors = [];

  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    return { ok: false, errors: ["ReplayNoOpRunSummary must be a JSON object"] };
  }
  validateForbiddenFields(errors, summary);

  for (const field of requiredFields) {
    if (!Object.hasOwn(summary, field)) {
      errors.push(`${field} is required`);
    }
  }
  if (summary.schema_version !== "replay_noop_run_summary.v1") {
    errors.push("schema_version must be replay_noop_run_summary.v1");
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
  if (summary.replay_mode !== "offline_fixture_replay") {
    errors.push("replay_mode is invalid");
  }
  if (!allowedStatuses.has(summary.status)) {
    errors.push("status is invalid");
  }
  for (const field of ["total_trace_records", "total_records_read", "total_artifacts_read"]) {
    if (!Number.isInteger(summary[field]) || summary[field] < 0) {
      errors.push(`${field} must be a non-negative integer`);
    }
  }
  if (summary.replay_noop_run_summary_id !== replayNoopRunSummaryId(
    summary.source_replay_clock_id,
    summary.source_replay_read_plan_id,
    summary.total_trace_records
  )) {
    errors.push("replay_noop_run_summary_id must be deterministic from source clock, read plan, and trace count");
  }
  for (const field of ["source_replay_run_manifest_id", "source_replay_clock_id", "source_replay_read_plan_id"]) {
    if (typeof summary[field] !== "string" || summary[field].length === 0) {
      errors.push(`${field} must be a non-empty string`);
    }
  }
  if (summary.status === "noop_replay_summary_ready" && summary.total_trace_records < 2) {
    errors.push("ready no-op replay summaries must include start and completed trace records");
  }
  if (summary.status === "noop_replay_summary_rejected" && summary.total_records_read > 0) {
    errors.push("rejected no-op replay summaries must not report records read");
  }
  if (Number.isInteger(summary.total_trace_records) && Number.isInteger(summary.total_records_read)) {
    if (summary.total_trace_records !== summary.total_records_read + 2) {
      errors.push("total_trace_records must equal total_records_read plus start and completed trace records");
    }
  }
  if (Number.isInteger(summary.total_records_read) && Number.isInteger(summary.total_artifacts_read)) {
    if (summary.total_artifacts_read > summary.total_records_read) {
      errors.push("total_artifacts_read must not exceed total_records_read");
    }
  }

  return { ok: errors.length === 0, errors };
}

export function formatReplayNoopRunSummaryValidationReport(report) {
  const lines = [
    "Overlord ReplayNoOpRunSummary Validation",
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
  const report = await validateReplayNoopRunSummaryFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatReplayNoopRunSummaryValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
