import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { resolveLocalArtifactPath } from "../../replay-engine/src/replay-artifact-reader.js";
import { validateForbiddenFields } from "./strategy-contract-rules.js";
import { allowedProcessingInputs } from "./build-strategy-observation-processing-contract.js";
import { strategyObservationProcessingTraceId } from "./strategy-observation-processing-trace-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_processing_trace.jsonl");
const sourceFixtures = {
  contract: readLocalJson("synthetic_strategy_observation_processing_contract.json"),
  inputSet: readLocalJson("synthetic_strategy_observation_processing_input_set.json")
};
const requiredFields = [
  "strategy_observation_processing_trace_id",
  "schema_version",
  "generated_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "strategy_observation_processing_contract_id",
  "strategy_observation_processing_input_set_id",
  "strategy_observation_stack_closeout_checkpoint_id",
  "source_strategy_observation_processing_contract_id",
  "source_strategy_observation_processing_input_set_id",
  "source_strategy_observation_stack_closeout_checkpoint_id",
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
  "noop_processing_started",
  "noop_processing_input_seen",
  "noop_processing_completed",
  "noop_processing_rejected"
]);
const allowedStatuses = new Set(["processing_trace_recorded", "processing_trace_rejected"]);
const allowedRunModes = new Set(["validation_only", "dry_run_planned"]);
const allowedInputSet = new Set(allowedProcessingInputs);

export async function validateStrategyObservationProcessingTraceFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let traces;
  try {
    traces = parseJsonl(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, (await validateStrategyObservationProcessingTraces(traces, options)).errors, traces.length);
}

export async function validateStrategyObservationProcessingTraces(traces, options = {}) {
  const errors = [];
  const root = options.repoRoot ?? repoRoot;

  if (!Array.isArray(traces) || traces.length === 0) {
    return { ok: false, errors: ["StrategyObservationProcessingTrace fixture must contain at least one JSONL record"] };
  }
  const seenIndexes = new Set();
  const seenIds = new Set();
  for (const [index, trace] of traces.entries()) {
    await validateTrace(errors, root, trace, index, seenIndexes, seenIds);
  }
  validateLifecycle(errors, traces);

  return { ok: errors.length === 0, errors };
}

export function formatStrategyObservationProcessingTraceValidationReport(report) {
  const lines = [
    "Overlord StrategyObservationProcessingTrace Validation",
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
    errors.push("strategy observation processing trace record must be an object");
    return;
  }
  validateForbiddenFields(errors, trace);
  for (const field of requiredFields) {
    if (!Object.hasOwn(trace, field)) errors.push(`${field} is required`);
  }
  validateCoreFields(errors, trace);
  validateIdShapes(errors, trace);
  validateSourceConsistency(errors, trace);
  await validateObservedInput(errors, root, trace);
  validateDeterministicId(errors, trace);

  if (trace.trace_index !== index) errors.push("trace_index must be deterministic and contiguous");
  if (seenIndexes.has(trace.trace_index)) errors.push("trace_index values must be unique");
  seenIndexes.add(trace.trace_index);
  if (seenIds.has(trace.strategy_observation_processing_trace_id)) errors.push("strategy_observation_processing_trace_id values must be unique");
  seenIds.add(trace.strategy_observation_processing_trace_id);
}

function validateCoreFields(errors, trace) {
  if (trace.schema_version !== "strategy_observation_processing_trace.v1") errors.push("schema_version must be strategy_observation_processing_trace.v1");
  if (Number.isNaN(Date.parse(trace.generated_at))) errors.push("generated_at must be a valid timestamp");
  if (trace.paper_only !== true) errors.push("paper_only must be true");
  if (trace.live_execution_allowed !== false) errors.push("live_execution_allowed must be false");
  if (trace.order_placement_allowed !== false) errors.push("order_placement_allowed must be false");
  if (trace.replay_mode !== "offline_fixture_replay") errors.push("replay_mode is invalid");
  if (!allowedRunModes.has(trace.run_mode)) errors.push("run_mode is invalid");
  if (!allowedTraceTypes.has(trace.trace_event_type)) errors.push("trace_event_type is invalid");
  if (!allowedStatuses.has(trace.status)) errors.push("status is invalid");
  if (trace.trace_event_type === "noop_processing_rejected" && trace.status !== "processing_trace_rejected") {
    errors.push("noop_processing_rejected traces must use processing_trace_rejected status");
  }
  if (trace.trace_event_type !== "noop_processing_rejected" && trace.status !== "processing_trace_recorded") {
    errors.push("non-rejected processing trace events must use processing_trace_recorded status");
  }
}

function validateIdShapes(errors, trace) {
  if (typeof trace.strategy_observation_processing_trace_id !== "string" || !trace.strategy_observation_processing_trace_id.startsWith("sopt_")) {
    errors.push("strategy_observation_processing_trace_id must reference a StrategyObservationProcessingTrace id");
  }
  if (typeof trace.strategy_observation_processing_contract_id !== "string" || !trace.strategy_observation_processing_contract_id.startsWith("sopc_")) {
    errors.push("strategy_observation_processing_contract_id must reference a StrategyObservationProcessingContract id");
  }
  if (typeof trace.strategy_observation_processing_input_set_id !== "string" || !trace.strategy_observation_processing_input_set_id.startsWith("sopis_")) {
    errors.push("strategy_observation_processing_input_set_id must reference a StrategyObservationProcessingInputSet id");
  }
  if (typeof trace.strategy_observation_stack_closeout_checkpoint_id !== "string" || !trace.strategy_observation_stack_closeout_checkpoint_id.startsWith("soscc_")) {
    errors.push("strategy_observation_stack_closeout_checkpoint_id must reference a StrategyObservationStackCloseoutCheckpoint id");
  }
  if (trace.source_strategy_observation_processing_contract_id !== trace.strategy_observation_processing_contract_id) {
    errors.push("source_strategy_observation_processing_contract_id must match strategy_observation_processing_contract_id");
  }
  if (trace.source_strategy_observation_processing_input_set_id !== trace.strategy_observation_processing_input_set_id) {
    errors.push("source_strategy_observation_processing_input_set_id must match strategy_observation_processing_input_set_id");
  }
  if (trace.source_strategy_observation_stack_closeout_checkpoint_id !== trace.strategy_observation_stack_closeout_checkpoint_id) {
    errors.push("source_strategy_observation_stack_closeout_checkpoint_id must match strategy_observation_stack_closeout_checkpoint_id");
  }
  if (typeof trace.source_strategy_definition_id !== "string" || !trace.source_strategy_definition_id.startsWith("sdef_")) {
    errors.push("source_strategy_definition_id must reference a StrategyDefinition id");
  }
  if (typeof trace.source_strategy_run_intent_id !== "string" || !trace.source_strategy_run_intent_id.startsWith("sri_")) {
    errors.push("source_strategy_run_intent_id must reference a StrategyRunIntent id");
  }
}

function validateSourceConsistency(errors, trace) {
  if (trace.strategy_observation_processing_contract_id !== sourceFixtures.contract.strategy_observation_processing_contract_id) {
    errors.push("strategy_observation_processing_contract_id must match local StrategyObservationProcessingContract fixture");
  }
  if (trace.strategy_observation_processing_input_set_id !== sourceFixtures.inputSet.strategy_observation_processing_input_set_id) {
    errors.push("strategy_observation_processing_input_set_id must match local StrategyObservationProcessingInputSet fixture");
  }
  if (trace.strategy_observation_stack_closeout_checkpoint_id !== sourceFixtures.inputSet.strategy_observation_stack_closeout_checkpoint_id) {
    errors.push("strategy_observation_stack_closeout_checkpoint_id must match local StrategyObservationProcessingInputSet fixture");
  }
}

async function validateObservedInput(errors, root, trace) {
  if (["noop_processing_started", "noop_processing_completed"].includes(trace.trace_event_type)) {
    if (trace.observed_input_type !== null) errors.push("processing boundary traces must use null observed_input_type");
    if (trace.observed_artifact_path !== null) errors.push("processing boundary traces must use null observed_artifact_path");
    if (trace.observed_record_count !== null) errors.push("processing boundary traces must use null observed_record_count");
    return;
  }
  if (trace.trace_event_type === "noop_processing_input_seen") {
    if (!allowedInputSet.has(trace.observed_input_type)) errors.push("observed_input_type is invalid");
    if (!Number.isInteger(trace.observed_record_count) || trace.observed_record_count < 0) errors.push("observed_record_count must be a non-negative integer");
    await validateSafePath(errors, root, trace.observed_artifact_path, "observed_artifact_path");
  }
}

function validateDeterministicId(errors, trace) {
  const expected = strategyObservationProcessingTraceId({
    strategyObservationProcessingContractId: trace.strategy_observation_processing_contract_id,
    strategyObservationProcessingInputSetId: trace.strategy_observation_processing_input_set_id,
    traceIndex: trace.trace_index,
    traceEventType: trace.trace_event_type,
    observedInputType: trace.observed_input_type,
    observedArtifactPath: trace.observed_artifact_path
  });
  if (trace.strategy_observation_processing_trace_id !== expected) {
    errors.push("strategy_observation_processing_trace_id must be deterministic from processing contract, input set, trace index, event type, input type, and artifact path");
  }
}

function validateLifecycle(errors, traces) {
  const startedCount = traces.filter((t) => t?.trace_event_type === "noop_processing_started").length;
  const completedCount = traces.filter((t) => t?.trace_event_type === "noop_processing_completed").length;
  if (startedCount !== 1) errors.push("StrategyObservationProcessingTrace must contain exactly one noop_processing_started trace");
  if (completedCount !== 1) errors.push("StrategyObservationProcessingTrace must contain exactly one noop_processing_completed trace");
  if (traces[0]?.trace_event_type !== "noop_processing_started") errors.push("StrategyObservationProcessingTrace must start with noop_processing_started");
  if (traces.at(-1)?.trace_event_type !== "noop_processing_completed") errors.push("StrategyObservationProcessingTrace must end with noop_processing_completed");
  for (let i = 1; i < traces.length - 1; i++) {
    if (traces[i]?.trace_event_type !== "noop_processing_input_seen") {
      errors.push("StrategyObservationProcessingTrace middle records must be noop_processing_input_seen events");
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

function readLocalJson(fileName) {
  return JSON.parse(readFileSync(path.join(repoRoot, "packages", "strategy-dsl", "fixtures", fileName), "utf8"));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const explicitPath = process.argv.find((arg) => arg.endsWith(".jsonl"));
  const report = await validateStrategyObservationProcessingTraceFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatStrategyObservationProcessingTraceValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
