import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { validateForbiddenFields } from "./strategy-contract-rules.js";
import { strategyObservationNoopSummaryId } from "./strategy-observation-noop-summary-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_noop_summary.json");
const requiredFields = [
  "strategy_observation_noop_summary_id",
  "schema_version",
  "generated_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "strategy_observation_contract_id",
  "strategy_observation_input_set_id",
  "strategy_dry_run_stack_closeout_checkpoint_id",
  "source_strategy_observation_contract_id",
  "source_strategy_observation_input_set_id",
  "source_strategy_dry_run_stack_closeout_checkpoint_id",
  "source_strategy_definition_id",
  "source_strategy_run_intent_id",
  "replay_mode",
  "run_mode",
  "total_trace_records",
  "total_inputs_observed",
  "status",
  "reason"
];
const allowedRunModes = new Set(["validation_only", "dry_run_planned"]);
const allowedStatuses = new Set(["observation_noop_summary_ready", "observation_noop_summary_rejected"]);

export async function validateStrategyObservationNoOpSummaryFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let summary;
  try {
    summary = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, validateStrategyObservationNoOpSummary(summary).errors);
}

export function validateStrategyObservationNoOpSummary(summary) {
  const errors = [];

  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    return { ok: false, errors: ["StrategyObservationNoOpSummary must be a JSON object"] };
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

export function formatStrategyObservationNoOpSummaryValidationReport(report) {
  const lines = [
    "Overlord StrategyObservationNoOpSummary Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) lines.push(`ERROR ${error}`);
  return lines.join("\n");
}

function validateCoreFields(errors, summary) {
  if (summary.schema_version !== "strategy_observation_noop_summary.v1") errors.push("schema_version must be strategy_observation_noop_summary.v1");
  if (Number.isNaN(Date.parse(summary.generated_at))) errors.push("generated_at must be a valid timestamp");
  if (summary.paper_only !== true) errors.push("paper_only must be true");
  if (summary.live_execution_allowed !== false) errors.push("live_execution_allowed must be false");
  if (summary.order_placement_allowed !== false) errors.push("order_placement_allowed must be false");
  if (summary.replay_mode !== "offline_fixture_replay") errors.push("replay_mode is invalid");
  if (!allowedRunModes.has(summary.run_mode)) errors.push("run_mode is invalid");
  if (!allowedStatuses.has(summary.status)) errors.push("status is invalid");
  for (const field of ["total_trace_records", "total_inputs_observed"]) {
    if (!Number.isInteger(summary[field]) || summary[field] < 0) errors.push(`${field} must be a non-negative integer`);
  }
  if (Number.isInteger(summary.total_trace_records) && Number.isInteger(summary.total_inputs_observed)) {
    if (summary.total_trace_records !== summary.total_inputs_observed + 2) {
      errors.push("total_trace_records must equal total_inputs_observed plus start and completed trace records");
    }
  }
}

function validateIdShapes(errors, summary) {
  if (typeof summary.strategy_observation_noop_summary_id !== "string" || !summary.strategy_observation_noop_summary_id.startsWith("sons_")) errors.push("strategy_observation_noop_summary_id must reference a StrategyObservationNoOpSummary id");
  if (typeof summary.strategy_observation_contract_id !== "string" || !summary.strategy_observation_contract_id.startsWith("soc_")) errors.push("strategy_observation_contract_id must reference a StrategyObservationContract id");
  if (typeof summary.strategy_observation_input_set_id !== "string" || !summary.strategy_observation_input_set_id.startsWith("sois_")) errors.push("strategy_observation_input_set_id must reference a StrategyObservationInputSet id");
  if (typeof summary.strategy_dry_run_stack_closeout_checkpoint_id !== "string" || !summary.strategy_dry_run_stack_closeout_checkpoint_id.startsWith("sdrscc_")) errors.push("strategy_dry_run_stack_closeout_checkpoint_id must reference a StrategyDryRunStackCloseoutCheckpoint id");
  if (summary.source_strategy_observation_contract_id !== summary.strategy_observation_contract_id) errors.push("source_strategy_observation_contract_id must match strategy_observation_contract_id");
  if (summary.source_strategy_observation_input_set_id !== summary.strategy_observation_input_set_id) errors.push("source_strategy_observation_input_set_id must match strategy_observation_input_set_id");
  if (summary.source_strategy_dry_run_stack_closeout_checkpoint_id !== summary.strategy_dry_run_stack_closeout_checkpoint_id) errors.push("source_strategy_dry_run_stack_closeout_checkpoint_id must match strategy_dry_run_stack_closeout_checkpoint_id");
  if (typeof summary.source_strategy_definition_id !== "string" || !summary.source_strategy_definition_id.startsWith("sdef_")) errors.push("source_strategy_definition_id must reference a StrategyDefinition id");
  if (typeof summary.source_strategy_run_intent_id !== "string" || !summary.source_strategy_run_intent_id.startsWith("sri_")) errors.push("source_strategy_run_intent_id must reference a StrategyRunIntent id");
}

function validateDeterministicId(errors, summary) {
  const expected = strategyObservationNoopSummaryId({
    strategyObservationContractId: summary.strategy_observation_contract_id,
    strategyObservationInputSetId: summary.strategy_observation_input_set_id,
    totalTraceRecords: summary.total_trace_records,
    totalInputsObserved: summary.total_inputs_observed
  });
  if (summary.strategy_observation_noop_summary_id !== expected) {
    errors.push("strategy_observation_noop_summary_id must be deterministic from observation contract, input set, and totals");
  }
}

function makeReport(filePath, errors) {
  return { ok: errors.length === 0, filePath: path.relative(repoRoot, filePath).replaceAll("\\", "/"), errors };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const explicitPath = process.argv.find((arg) => arg.endsWith(".json"));
  const report = await validateStrategyObservationNoOpSummaryFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatStrategyObservationNoOpSummaryValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
