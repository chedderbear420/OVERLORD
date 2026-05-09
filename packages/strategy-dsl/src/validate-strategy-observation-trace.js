import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { resolveLocalArtifactPath } from "../../replay-engine/src/replay-artifact-reader.js";
import { validateForbiddenFields } from "./strategy-contract-rules.js";
import { allowedObservationInputs } from "./build-strategy-observation-contract.js";
import { strategyObservationTraceId } from "./strategy-observation-trace-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_trace.jsonl");
const requiredFields = [
  "strategy_observation_trace_id",
  "schema_version",
  "generated_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "strategy_observation_contract_id",
  "strategy_observation_input_set_id",
  "strategy_dry_run_stack_closeout_checkpoint_id",
  "strategy_definition_id",
  "strategy_run_intent_id",
  "source_strategy_observation_contract_id",
  "source_strategy_observation_input_set_id",
  "source_strategy_dry_run_stack_closeout_checkpoint_id",
  "source_strategy_definition_id",
  "source_strategy_run_intent_id",
  "replay_mode",
  "run_mode",
  "trace_event_type",
  "trace_index",
  "observed_input_type",
  "observed_artifact_path",
  "observed_record_count",
  "status",
  "reason"
];
const allowedTraceTypes = new Set([
  "noop_observation_started",
  "noop_observation_input_seen",
  "noop_observation_completed",
  "noop_observation_rejected"
]);
const allowedStatuses = new Set(["observation_trace_recorded", "observation_trace_rejected"]);
const allowedRunModes = new Set(["validation_only", "dry_run_planned"]);
const allowedInputSet = new Set(allowedObservationInputs);

export async function validateStrategyObservationTraceFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let traces;
  try {
    traces = parseJsonl(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, (await validateStrategyObservationTraces(traces, options)).errors, traces.length);
}

export async function validateStrategyObservationTraces(traces, options = {}) {
  const errors = [];
  const root = options.repoRoot ?? repoRoot;

  if (!Array.isArray(traces) || traces.length === 0) {
    return { ok: false, errors: ["StrategyObservationTrace fixture must contain at least one JSONL record"] };
  }
  const seenIndexes = new Set();
  const seenIds = new Set();
  for (const [index, trace] of traces.entries()) {
    await validateTrace(errors, root, trace, index, seenIndexes, seenIds);
  }
  validateLifecycle(errors, traces);

  return { ok: errors.length === 0, errors };
}

export function formatStrategyObservationTraceValidationReport(report) {
  const lines = [
    "Overlord StrategyObservationTrace Validation",
    `fixture: ${report.filePath}`,
    `records: ${report.recordCount ?? "unknown"}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) lines.push(`ERROR ${error}`);
  return lines.join("\n");
}

async function validateTrace(errors, root, trace, index, seenIndexes, seenIds) {
  if (!trace || typeof trace !== "object" || Array.isArray(trace)) {
    errors.push("strategy observation trace record must be an object");
    return;
  }
  validateForbiddenFields(errors, trace);
  for (const field of requiredFields) {
    if (!Object.hasOwn(trace, field)) errors.push(`${field} is required`);
  }
  validateCoreFields(errors, trace);
  validateIdShapes(errors, trace);
  await validateObservedInput(errors, root, trace);
  validateDeterministicId(errors, trace);

  if (trace.trace_index !== index) errors.push("trace_index must be deterministic and contiguous");
  if (seenIndexes.has(trace.trace_index)) errors.push("trace_index values must be unique");
  seenIndexes.add(trace.trace_index);
  if (seenIds.has(trace.strategy_observation_trace_id)) errors.push("strategy_observation_trace_id values must be unique");
  seenIds.add(trace.strategy_observation_trace_id);
}

function validateCoreFields(errors, trace) {
  if (trace.schema_version !== "strategy_observation_trace.v1") errors.push("schema_version must be strategy_observation_trace.v1");
  if (Number.isNaN(Date.parse(trace.generated_at))) errors.push("generated_at must be a valid timestamp");
  if (trace.paper_only !== true) errors.push("paper_only must be true");
  if (trace.live_execution_allowed !== false) errors.push("live_execution_allowed must be false");
  if (trace.order_placement_allowed !== false) errors.push("order_placement_allowed must be false");
  if (trace.replay_mode !== "offline_fixture_replay") errors.push("replay_mode is invalid");
  if (!allowedRunModes.has(trace.run_mode)) errors.push("run_mode is invalid");
  if (!allowedTraceTypes.has(trace.trace_event_type)) errors.push("trace_event_type is invalid");
  if (!allowedStatuses.has(trace.status)) errors.push("status is invalid");
  if (trace.trace_event_type === "noop_observation_rejected" && trace.status !== "observation_trace_rejected") {
    errors.push("noop_observation_rejected traces must use observation_trace_rejected status");
  }
  if (trace.trace_event_type !== "noop_observation_rejected" && trace.status !== "observation_trace_recorded") {
    errors.push("non-rejected observation trace events must use observation_trace_recorded status");
  }
}

function validateIdShapes(errors, trace) {
  if (typeof trace.strategy_observation_trace_id !== "string" || !trace.strategy_observation_trace_id.startsWith("sot_")) errors.push("strategy_observation_trace_id must reference a StrategyObservationTrace id");
  if (typeof trace.strategy_observation_contract_id !== "string" || !trace.strategy_observation_contract_id.startsWith("soc_")) errors.push("strategy_observation_contract_id must reference a StrategyObservationContract id");
  if (typeof trace.strategy_observation_input_set_id !== "string" || !trace.strategy_observation_input_set_id.startsWith("sois_")) errors.push("strategy_observation_input_set_id must reference a StrategyObservationInputSet id");
  if (typeof trace.strategy_dry_run_stack_closeout_checkpoint_id !== "string" || !trace.strategy_dry_run_stack_closeout_checkpoint_id.startsWith("sdrscc_")) errors.push("strategy_dry_run_stack_closeout_checkpoint_id must reference a StrategyDryRunStackCloseoutCheckpoint id");
  if (typeof trace.strategy_definition_id !== "string" || !trace.strategy_definition_id.startsWith("sdef_")) errors.push("strategy_definition_id must reference a StrategyDefinition id");
  if (typeof trace.strategy_run_intent_id !== "string" || !trace.strategy_run_intent_id.startsWith("sri_")) errors.push("strategy_run_intent_id must reference a StrategyRunIntent id");
  if (trace.source_strategy_observation_contract_id !== trace.strategy_observation_contract_id) errors.push("source_strategy_observation_contract_id must match strategy_observation_contract_id");
  if (trace.source_strategy_observation_input_set_id !== trace.strategy_observation_input_set_id) errors.push("source_strategy_observation_input_set_id must match strategy_observation_input_set_id");
  if (trace.source_strategy_dry_run_stack_closeout_checkpoint_id !== trace.strategy_dry_run_stack_closeout_checkpoint_id) errors.push("source_strategy_dry_run_stack_closeout_checkpoint_id must match strategy_dry_run_stack_closeout_checkpoint_id");
  if (trace.source_strategy_definition_id !== trace.strategy_definition_id) errors.push("source_strategy_definition_id must match strategy_definition_id");
  if (trace.source_strategy_run_intent_id !== trace.strategy_run_intent_id) errors.push("source_strategy_run_intent_id must match strategy_run_intent_id");
}

async function validateObservedInput(errors, root, trace) {
  if (["noop_observation_started", "noop_observation_completed"].includes(trace.trace_event_type)) {
    if (trace.observed_input_type !== null) errors.push("observation boundary traces must use null observed_input_type");
    if (trace.observed_artifact_path !== null) errors.push("observation boundary traces must use null observed_artifact_path");
    if (trace.observed_record_count !== null) errors.push("observation boundary traces must use null observed_record_count");
    return;
  }
  if (trace.trace_event_type === "noop_observation_input_seen") {
    if (!allowedInputSet.has(trace.observed_input_type)) errors.push("observed_input_type is invalid");
    if (!Number.isInteger(trace.observed_record_count) || trace.observed_record_count < 0) errors.push("observed_record_count must be a non-negative integer");
    await validateSafePath(errors, root, trace.observed_artifact_path, "observed_artifact_path");
  }
}

function validateDeterministicId(errors, trace) {
  const expected = strategyObservationTraceId({
    strategyObservationContractId: trace.strategy_observation_contract_id,
    strategyObservationInputSetId: trace.strategy_observation_input_set_id,
    traceIndex: trace.trace_index,
    traceEventType: trace.trace_event_type,
    observedInputType: trace.observed_input_type,
    observedArtifactPath: trace.observed_artifact_path
  });
  if (trace.strategy_observation_trace_id !== expected) {
    errors.push("strategy_observation_trace_id must be deterministic from observation contract, input set, trace index, event type, input type, and artifact path");
  }
}

function validateLifecycle(errors, traces) {
  const startedCount = traces.filter((trace) => trace?.trace_event_type === "noop_observation_started").length;
  const completedCount = traces.filter((trace) => trace?.trace_event_type === "noop_observation_completed").length;
  if (startedCount !== 1) errors.push("StrategyObservationTrace must contain exactly one noop_observation_started trace");
  if (completedCount !== 1) errors.push("StrategyObservationTrace must contain exactly one noop_observation_completed trace");
  if (traces[0]?.trace_event_type !== "noop_observation_started") errors.push("StrategyObservationTrace must start with noop_observation_started");
  if (traces[traces.length - 1]?.trace_event_type !== "noop_observation_completed") errors.push("StrategyObservationTrace must end with noop_observation_completed");
  for (let index = 1; index < traces.length - 1; index += 1) {
    if (traces[index]?.trace_event_type !== "noop_observation_input_seen") {
      errors.push("StrategyObservationTrace middle records must be noop_observation_input_seen events");
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
  return { ok: errors.length === 0, filePath: path.relative(repoRoot, filePath).replaceAll("\\", "/"), recordCount, errors };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const explicitPath = process.argv.find((arg) => arg.endsWith(".jsonl"));
  const report = await validateStrategyObservationTraceFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatStrategyObservationTraceValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
