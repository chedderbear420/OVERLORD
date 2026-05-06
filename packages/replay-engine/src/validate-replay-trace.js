import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { replayTraceId } from "./replay-trace-id.js";
import { resolveLocalArtifactPath } from "./replay-artifact-reader.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "replay-engine", "fixtures", "synthetic_replay_trace.jsonl");
const requiredFields = [
  "replay_trace_id",
  "schema_version",
  "generated_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "replay_mode",
  "trace_event_type",
  "trace_index",
  "source_replay_run_manifest_id",
  "source_replay_clock_id",
  "source_replay_read_plan_id",
  "source_manifest_path",
  "artifact_type",
  "artifact_path",
  "record_ref",
  "record_time",
  "record_id",
  "status",
  "reason"
];
const allowedTraceTypes = new Set(["noop_record_read", "noop_replay_started", "noop_replay_completed", "noop_replay_rejected"]);
const allowedStatuses = new Set(["trace_recorded", "trace_rejected"]);
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

export async function validateReplayTraceFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let traces;
  try {
    traces = parseJsonl(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, (await validateReplayTraces(traces, options)).errors, traces.length);
}

export async function validateReplayTraces(traces, options = {}) {
  const errors = [];
  const root = options.repoRoot ?? repoRoot;

  if (!Array.isArray(traces) || traces.length === 0) {
    return { ok: false, errors: ["ReplayTrace fixture must contain at least one JSONL record"] };
  }

  const seenIndexes = new Set();
  const seenIds = new Set();
  for (const [index, trace] of traces.entries()) {
    await validateTrace(errors, root, trace, index, seenIndexes, seenIds);
  }

  return { ok: errors.length === 0, errors };
}

export function formatReplayTraceValidationReport(report) {
  const lines = [
    "Overlord ReplayTrace Validation",
    `fixture: ${report.filePath}`,
    `records: ${report.recordCount ?? "unknown"}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) {
    lines.push(`ERROR ${error}`);
  }
  return lines.join("\n");
}

async function validateTrace(errors, root, trace, index, seenIndexes, seenIds) {
  if (!trace || typeof trace !== "object" || Array.isArray(trace)) {
    errors.push("trace record must be an object");
    return;
  }
  validateForbiddenFields(errors, trace);
  for (const field of requiredFields) {
    if (!Object.hasOwn(trace, field)) {
      errors.push(`${field} is required`);
    }
  }
  if (trace.schema_version !== "replay_trace.v1") {
    errors.push("schema_version must be replay_trace.v1");
  }
  if (Number.isNaN(Date.parse(trace.generated_at))) {
    errors.push("generated_at must be a valid timestamp");
  }
  if (trace.paper_only !== true) {
    errors.push("paper_only must be true");
  }
  if (trace.live_execution_allowed !== false) {
    errors.push("live_execution_allowed must be false");
  }
  if (trace.order_placement_allowed !== false) {
    errors.push("order_placement_allowed must be false");
  }
  if (trace.replay_mode !== "offline_fixture_replay") {
    errors.push("replay_mode is invalid");
  }
  if (!allowedTraceTypes.has(trace.trace_event_type)) {
    errors.push("trace_event_type is invalid");
  }
  if (!allowedStatuses.has(trace.status)) {
    errors.push("status is invalid");
  }
  if (trace.trace_index !== index) {
    errors.push("trace_index must be deterministic and contiguous");
  }
  if (seenIndexes.has(trace.trace_index)) {
    errors.push("trace_index values must be unique");
  }
  seenIndexes.add(trace.trace_index);
  if (seenIds.has(trace.replay_trace_id)) {
    errors.push("replay_trace_id values must be unique");
  }
  seenIds.add(trace.replay_trace_id);
  if (trace.replay_trace_id !== replayTraceId(trace.source_replay_clock_id, trace.trace_index, trace.trace_event_type, trace.record_ref)) {
    errors.push("replay_trace_id must be deterministic from source clock, trace index, event type, and record_ref");
  }
  if (Number.isNaN(Date.parse(trace.record_time))) {
    errors.push("record_time must be a valid timestamp");
  }
  if (trace.record_id !== null && typeof trace.record_id !== "string") {
    errors.push("record_id must be a string or null");
  }
  await validateSafePath(errors, root, trace.source_manifest_path, "source_manifest_path");
  await validateSafePath(errors, root, trace.artifact_path, "artifact_path");
}

async function validateSafePath(errors, root, artifactPath, label) {
  try {
    await resolveLocalArtifactPath(root, artifactPath);
  } catch (error) {
    errors.push(`${label} ${error.message}`);
  }
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

function parseJsonl(content) {
  return content
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}

function makeReport(filePath, errors, recordCount = null) {
  return {
    ok: errors.length === 0,
    filePath: path.relative(repoRoot, filePath).replaceAll("\\", "/"),
    recordCount,
    errors
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const explicitPath = process.argv.find((arg) => arg.endsWith(".jsonl"));
  const report = await validateReplayTraceFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatReplayTraceValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
