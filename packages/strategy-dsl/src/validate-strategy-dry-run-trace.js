import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { validateForbiddenFields } from "./strategy-contract-rules.js";
import { allowedDryRunStepTypes } from "./build-strategy-dry-run-plan.js";
import { strategyDryRunTraceId } from "./strategy-dry-run-trace-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_dry_run_trace.jsonl");
const requiredFields = [
  "strategy_dry_run_trace_id",
  "schema_version",
  "generated_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "strategy_dry_run_readiness_checkpoint_id",
  "strategy_dry_run_plan_id",
  "strategy_dry_run_plan_evidence_summary_id",
  "strategy_definition_id",
  "strategy_run_intent_id",
  "source_strategy_definition_id",
  "source_strategy_run_intent_id",
  "source_strategy_run_manifest_id",
  "source_strategy_run_evidence_bundle_id",
  "replay_mode",
  "run_mode",
  "trace_event_type",
  "trace_index",
  "planned_observation_step",
  "observed_artifact_type",
  "observed_artifact_ref",
  "status",
  "reason"
];
const allowedTraceTypes = new Set([
  "noop_dry_run_started",
  "noop_dry_run_step_observed",
  "noop_dry_run_completed",
  "noop_dry_run_rejected"
]);
const allowedStatuses = new Set(["dry_run_trace_recorded", "dry_run_trace_rejected"]);
const allowedRunModes = new Set(["validation_only", "dry_run_planned"]);
const forbiddenStepTypes = new Set([
  "execute_strategy",
  "calculate_edge",
  "generate_signal",
  "generate_risk_decision",
  "generate_action_decision",
  "create_paper_entry",
  "create_paper_exit",
  "recommend_trade",
  "place_order"
]);

export async function validateStrategyDryRunTraceFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let traces;
  try {
    traces = parseJsonl(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, validateStrategyDryRunTraces(traces).errors, traces.length);
}

export function validateStrategyDryRunTraces(traces) {
  const errors = [];

  if (!Array.isArray(traces) || traces.length === 0) {
    return { ok: false, errors: ["StrategyDryRunTrace fixture must contain at least one JSONL record"] };
  }
  const seenIndexes = new Set();
  const seenIds = new Set();
  for (const [index, trace] of traces.entries()) {
    validateTrace(errors, trace, index, seenIndexes, seenIds);
  }
  validateLifecycle(errors, traces);

  return { ok: errors.length === 0, errors };
}

export function formatStrategyDryRunTraceValidationReport(report) {
  const lines = [
    "Overlord StrategyDryRunTrace Validation",
    `fixture: ${report.filePath}`,
    `records: ${report.recordCount ?? "unknown"}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) lines.push(`ERROR ${error}`);
  return lines.join("\n");
}

function validateTrace(errors, trace, index, seenIndexes, seenIds) {
  if (!trace || typeof trace !== "object" || Array.isArray(trace)) {
    errors.push("strategy dry-run trace record must be an object");
    return;
  }
  validateForbiddenFields(errors, trace);
  for (const field of requiredFields) {
    if (!Object.hasOwn(trace, field)) errors.push(`${field} is required`);
  }
  validateCoreFields(errors, trace);
  validateIdShapes(errors, trace);
  validateStep(errors, trace);
  validateDeterministicId(errors, trace);

  if (trace.trace_index !== index) errors.push("trace_index must be deterministic and contiguous");
  if (seenIndexes.has(trace.trace_index)) errors.push("trace_index values must be unique");
  seenIndexes.add(trace.trace_index);
  if (seenIds.has(trace.strategy_dry_run_trace_id)) errors.push("strategy_dry_run_trace_id values must be unique");
  seenIds.add(trace.strategy_dry_run_trace_id);
}

function validateCoreFields(errors, trace) {
  if (trace.schema_version !== "strategy_dry_run_trace.v1") errors.push("schema_version must be strategy_dry_run_trace.v1");
  if (Number.isNaN(Date.parse(trace.generated_at))) errors.push("generated_at must be a valid timestamp");
  if (trace.paper_only !== true) errors.push("paper_only must be true");
  if (trace.live_execution_allowed !== false) errors.push("live_execution_allowed must be false");
  if (trace.order_placement_allowed !== false) errors.push("order_placement_allowed must be false");
  if (trace.replay_mode !== "offline_fixture_replay") errors.push("replay_mode is invalid");
  if (!allowedRunModes.has(trace.run_mode)) errors.push("run_mode is invalid");
  if (!allowedTraceTypes.has(trace.trace_event_type)) errors.push("trace_event_type is invalid");
  if (!allowedStatuses.has(trace.status)) errors.push("status is invalid");
  if (trace.trace_event_type === "noop_dry_run_rejected" && trace.status !== "dry_run_trace_rejected") {
    errors.push("noop_dry_run_rejected traces must use dry_run_trace_rejected status");
  }
  if (trace.trace_event_type !== "noop_dry_run_rejected" && trace.status !== "dry_run_trace_recorded") {
    errors.push("non-rejected dry-run trace events must use dry_run_trace_recorded status");
  }
}

function validateIdShapes(errors, trace) {
  if (typeof trace.strategy_dry_run_readiness_checkpoint_id !== "string" || !trace.strategy_dry_run_readiness_checkpoint_id.startsWith("sdrpc_")) errors.push("strategy_dry_run_readiness_checkpoint_id must reference a StrategyDryRunReadinessCheckpoint id");
  if (typeof trace.strategy_dry_run_plan_id !== "string" || !trace.strategy_dry_run_plan_id.startsWith("sdrp_")) errors.push("strategy_dry_run_plan_id must reference a StrategyDryRunPlan id");
  if (typeof trace.strategy_dry_run_plan_evidence_summary_id !== "string" || !trace.strategy_dry_run_plan_evidence_summary_id.startsWith("sdrpes_")) errors.push("strategy_dry_run_plan_evidence_summary_id must reference a StrategyDryRunPlanEvidenceSummary id");
  if (typeof trace.strategy_definition_id !== "string" || !trace.strategy_definition_id.startsWith("sdef_")) errors.push("strategy_definition_id must reference a StrategyDefinition id");
  if (typeof trace.strategy_run_intent_id !== "string" || !trace.strategy_run_intent_id.startsWith("sri_")) errors.push("strategy_run_intent_id must reference a StrategyRunIntent id");
  if (trace.source_strategy_definition_id !== trace.strategy_definition_id) errors.push("source_strategy_definition_id must match strategy_definition_id");
  if (trace.source_strategy_run_intent_id !== trace.strategy_run_intent_id) errors.push("source_strategy_run_intent_id must match strategy_run_intent_id");
  if (typeof trace.source_strategy_run_manifest_id !== "string" || !trace.source_strategy_run_manifest_id.startsWith("srm_")) errors.push("source_strategy_run_manifest_id must reference a StrategyRunManifest id");
  if (typeof trace.source_strategy_run_evidence_bundle_id !== "string" || !trace.source_strategy_run_evidence_bundle_id.startsWith("sreb_")) errors.push("source_strategy_run_evidence_bundle_id must reference a StrategyRunEvidenceBundle id");
}

function validateStep(errors, trace) {
  if (["noop_dry_run_started", "noop_dry_run_completed"].includes(trace.trace_event_type)) {
    if (trace.planned_observation_step !== null) errors.push("dry-run boundary traces must use null planned_observation_step");
    if (trace.observed_artifact_type !== null) errors.push("dry-run boundary traces must use null observed_artifact_type");
    return;
  }
  if (trace.trace_event_type === "noop_dry_run_step_observed") {
    const step = trace.planned_observation_step;
    if (!step || typeof step !== "object" || Array.isArray(step)) {
      errors.push("noop_dry_run_step_observed requires planned_observation_step object");
      return;
    }
    if (!allowedDryRunStepTypes.includes(step.step_type)) errors.push("planned_observation_step step_type is invalid");
    if (forbiddenStepTypes.has(step.step_type)) errors.push("planned_observation_step step_type is forbidden");
    if (step.metadata_only !== true) errors.push("planned_observation_step metadata_only must be true");
    if (!Array.isArray(step.reads) || step.reads.length === 0) errors.push("planned_observation_step reads must be a non-empty array");
    if (trace.observed_artifact_type !== step.reads?.[0]) errors.push("observed_artifact_type must match first planned read");
  }
}

function validateDeterministicId(errors, trace) {
  const expected = strategyDryRunTraceId({
    strategyDryRunReadinessCheckpointId: trace.strategy_dry_run_readiness_checkpoint_id,
    traceIndex: trace.trace_index,
    traceEventType: trace.trace_event_type,
    plannedObservationStepType: trace.planned_observation_step?.step_type ?? "dry_run_boundary",
    observedArtifactRef: trace.observed_artifact_ref
  });
  if (trace.strategy_dry_run_trace_id !== expected) {
    errors.push("strategy_dry_run_trace_id must be deterministic from readiness checkpoint, trace index, event type, step type, and observed artifact ref");
  }
}

function validateLifecycle(errors, traces) {
  if (traces[0]?.trace_event_type !== "noop_dry_run_started") errors.push("StrategyDryRunTrace must start with noop_dry_run_started");
  const last = traces[traces.length - 1];
  if (!["noop_dry_run_completed", "noop_dry_run_rejected"].includes(last?.trace_event_type)) {
    errors.push("StrategyDryRunTrace must end with noop_dry_run_completed or noop_dry_run_rejected");
  }
  for (let index = 1; index < traces.length - 1; index += 1) {
    if (traces[index]?.trace_event_type !== "noop_dry_run_step_observed") {
      errors.push("StrategyDryRunTrace middle records must be noop_dry_run_step_observed events");
    }
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
  const report = await validateStrategyDryRunTraceFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatStrategyDryRunTraceValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
