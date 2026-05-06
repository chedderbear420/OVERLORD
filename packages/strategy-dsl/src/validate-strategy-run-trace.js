import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { resolveLocalArtifactPath } from "../../replay-engine/src/replay-artifact-reader.js";
import { validateForbiddenFields } from "./strategy-contract-rules.js";
import { strategyRunTraceId } from "./strategy-run-trace-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_run_trace.jsonl");
const requiredFields = [
  "strategy_run_trace_id",
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
  "source_replay_trace_id",
  "replay_mode",
  "run_mode",
  "trace_event_type",
  "trace_index",
  "artifact_type",
  "artifact_path",
  "record_ref",
  "record_time",
  "record_id",
  "status",
  "reason"
];
const allowedTraceTypes = new Set([
  "noop_strategy_run_started",
  "noop_strategy_input_observed",
  "noop_strategy_run_completed",
  "noop_strategy_run_rejected"
]);
const allowedStatuses = new Set(["strategy_trace_recorded", "strategy_trace_rejected"]);
const allowedRunModes = new Set(["validation_only", "dry_run_planned"]);

export async function validateStrategyRunTraceFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let traces;
  try {
    traces = parseJsonl(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, (await validateStrategyRunTraces(traces, options)).errors, traces.length);
}

export async function validateStrategyRunTraces(traces, options = {}) {
  const errors = [];
  const root = options.repoRoot ?? repoRoot;

  if (!Array.isArray(traces) || traces.length === 0) {
    return { ok: false, errors: ["StrategyRunTrace fixture must contain at least one JSONL record"] };
  }

  const seenIndexes = new Set();
  const seenIds = new Set();
  for (const [index, trace] of traces.entries()) {
    await validateTrace(errors, root, trace, index, seenIndexes, seenIds);
  }
  validateTraceLifecycle(errors, traces);

  return { ok: errors.length === 0, errors };
}

export function formatStrategyRunTraceValidationReport(report) {
  const lines = [
    "Overlord StrategyRunTrace Validation",
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
    errors.push("strategy trace record must be an object");
    return;
  }
  validateForbiddenFields(errors, trace);
  for (const field of requiredFields) {
    if (!Object.hasOwn(trace, field)) {
      errors.push(`${field} is required`);
    }
  }
  if (trace.schema_version !== "strategy_run_trace.v1") {
    errors.push("schema_version must be strategy_run_trace.v1");
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
  if (typeof trace.strategy_definition_id !== "string" || !trace.strategy_definition_id.startsWith("sdef_")) {
    errors.push("strategy_definition_id must reference a StrategyDefinition id");
  }
  if (typeof trace.strategy_run_intent_id !== "string" || !trace.strategy_run_intent_id.startsWith("sri_")) {
    errors.push("strategy_run_intent_id must reference a StrategyRunIntent id");
  }
  if (typeof trace.source_replay_run_manifest_id !== "string" || !trace.source_replay_run_manifest_id.startsWith("rrm_")) {
    errors.push("source_replay_run_manifest_id must reference a ReplayRunManifest id");
  }
  if (typeof trace.source_replay_evidence_bundle_id !== "string" || !trace.source_replay_evidence_bundle_id.startsWith("reb_")) {
    errors.push("source_replay_evidence_bundle_id must reference a ReplayEvidenceBundle id");
  }
  if (typeof trace.source_replay_clock_id !== "string" || !trace.source_replay_clock_id.startsWith("rclk_")) {
    errors.push("source_replay_clock_id must reference a ReplayClock id");
  }
  if (typeof trace.source_replay_read_plan_id !== "string" || !trace.source_replay_read_plan_id.startsWith("rrp_")) {
    errors.push("source_replay_read_plan_id must reference a ReplayReadPlan id");
  }
  if (trace.source_replay_trace_id !== null && (typeof trace.source_replay_trace_id !== "string" || !trace.source_replay_trace_id.startsWith("rtrace_"))) {
    errors.push("source_replay_trace_id must reference a ReplayTrace id or null");
  }
  if (trace.replay_mode !== "offline_fixture_replay") {
    errors.push("replay_mode is invalid");
  }
  if (!allowedRunModes.has(trace.run_mode)) {
    errors.push("run_mode is invalid");
  }
  if (!allowedTraceTypes.has(trace.trace_event_type)) {
    errors.push("trace_event_type is invalid");
  }
  if (!allowedStatuses.has(trace.status)) {
    errors.push("status is invalid");
  }
  if (trace.trace_event_type === "noop_strategy_run_rejected" && trace.status !== "strategy_trace_rejected") {
    errors.push("noop_strategy_run_rejected traces must use strategy_trace_rejected status");
  }
  if (trace.trace_event_type !== "noop_strategy_run_rejected" && trace.status !== "strategy_trace_recorded") {
    errors.push("non-rejected strategy trace events must use strategy_trace_recorded status");
  }
  if (trace.trace_index !== index) {
    errors.push("trace_index must be deterministic and contiguous");
  }
  if (seenIndexes.has(trace.trace_index)) {
    errors.push("trace_index values must be unique");
  }
  seenIndexes.add(trace.trace_index);
  if (seenIds.has(trace.strategy_run_trace_id)) {
    errors.push("strategy_run_trace_id values must be unique");
  }
  seenIds.add(trace.strategy_run_trace_id);
  if (trace.strategy_run_trace_id !== strategyRunTraceId(trace.strategy_run_intent_id, trace.trace_index, trace.trace_event_type, trace.record_ref)) {
    errors.push("strategy_run_trace_id must be deterministic from strategy run intent, trace index, event type, and record_ref");
  }
  if (Number.isNaN(Date.parse(trace.record_time))) {
    errors.push("record_time must be a valid timestamp");
  }
  if (typeof trace.record_ref !== "string" || trace.record_ref.length === 0) {
    errors.push("record_ref must be a non-empty string");
  }
  if (typeof trace.artifact_type !== "string" || trace.artifact_type.length === 0) {
    errors.push("artifact_type must be a non-empty string");
  }
  if (trace.record_id !== null && typeof trace.record_id !== "string") {
    errors.push("record_id must be a string or null");
  }
  if (trace.trace_event_type === "noop_strategy_input_observed") {
    if (typeof trace.source_replay_trace_id !== "string") {
      errors.push("noop_strategy_input_observed traces must reference source_replay_trace_id");
    }
    if (typeof trace.record_id !== "string" || trace.record_id.length === 0) {
      errors.push("noop_strategy_input_observed traces must include a record_id");
    }
    if (typeof trace.artifact_path === "string" && typeof trace.record_ref === "string" && !trace.record_ref.startsWith(`${trace.artifact_path}#`)) {
      errors.push("noop_strategy_input_observed record_ref must reference artifact_path");
    }
  }
  if (["noop_strategy_run_started", "noop_strategy_run_completed"].includes(trace.trace_event_type)) {
    if (trace.artifact_type !== "strategy_control") {
      errors.push("no-op strategy boundary traces must use strategy_control artifact_type");
    }
    if (trace.record_id !== null) {
      errors.push("no-op strategy boundary traces must use null record_id");
    }
    if (trace.source_replay_trace_id !== null) {
      errors.push("no-op strategy boundary traces must use null source_replay_trace_id");
    }
  }
  await validateSafePath(errors, root, trace.artifact_path, "artifact_path");
}

function validateTraceLifecycle(errors, traces) {
  const firstTrace = traces[0];
  const lastTrace = traces[traces.length - 1];
  if (firstTrace?.trace_event_type !== "noop_strategy_run_started") {
    errors.push("StrategyRunTrace must start with noop_strategy_run_started");
  }
  if (lastTrace?.trace_event_type !== "noop_strategy_run_completed" && lastTrace?.trace_event_type !== "noop_strategy_run_rejected") {
    errors.push("StrategyRunTrace must end with noop_strategy_run_completed or noop_strategy_run_rejected");
  }
  for (let index = 1; index < traces.length - 1; index += 1) {
    if (traces[index]?.trace_event_type !== "noop_strategy_input_observed") {
      errors.push("StrategyRunTrace middle records must be noop_strategy_input_observed events");
    }
  }
  for (let index = 1; index < traces.length; index += 1) {
    const previous = traces[index - 1];
    const current = traces[index];
    for (const field of ["strategy_definition_id", "strategy_run_intent_id", "source_replay_run_manifest_id", "source_replay_evidence_bundle_id", "source_replay_clock_id", "source_replay_read_plan_id"]) {
      if (previous?.[field] !== current?.[field]) {
        errors.push(`StrategyRunTrace records must share ${field}`);
      }
    }
  }
}

async function validateSafePath(errors, root, artifactPath, label) {
  try {
    await resolveLocalArtifactPath(root, artifactPath);
  } catch (error) {
    errors.push(`${label} ${error.message}`);
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
  const report = await validateStrategyRunTraceFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatStrategyRunTraceValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
