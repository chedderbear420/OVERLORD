import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { validateForbiddenFields } from "./strategy-contract-rules.js";
import {
  allowedProcessingInputs,
  allowedProcessingOutputs,
  allowedProcessingRules,
  requiredForbiddenProcessingOutputs
} from "./build-strategy-observation-processing-contract.js";
import { strategyObservationProcessingContractId } from "./strategy-observation-processing-contract-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_processing_contract.json");
const requiredFields = [
  "strategy_observation_processing_contract_id",
  "schema_version",
  "generated_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "strategy_definition_id",
  "strategy_run_intent_id",
  "strategy_observation_stack_closeout_checkpoint_id",
  "source_strategy_observation_stack_closeout_checkpoint_id",
  "source_strategy_observation_case_file_summary_id",
  "source_strategy_observation_evidence_bundle_id",
  "source_strategy_observation_noop_summary_id",
  "source_strategy_definition_id",
  "source_strategy_run_intent_id",
  "replay_mode",
  "run_mode",
  "allowed_processing_inputs",
  "allowed_processing_outputs",
  "forbidden_processing_outputs",
  "processing_rules",
  "status",
  "reason"
];
const allowedStatuses = new Set(["strategy_observation_processing_contract_ready", "strategy_observation_processing_contract_rejected"]);
const allowedRunModes = new Set(["validation_only", "dry_run_planned"]);
const allowedInputSet = new Set(allowedProcessingInputs);
const allowedOutputSet = new Set(allowedProcessingOutputs);
const allowedRuleSet = new Set(allowedProcessingRules);
const forbiddenRules = new Set([
  "execute_strategy",
  "calculate_edge",
  "generate_signal",
  "generate_risk_decision",
  "generate_action_decision",
  "create_paper_entry",
  "create_paper_exit",
  "recommend_trade",
  "allocate_bankroll",
  "calculate_performance",
  "calculate_roi",
  "place_order",
  "connect_external"
]);

export async function validateStrategyObservationProcessingContractFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let contract;
  try {
    contract = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, validateStrategyObservationProcessingContract(contract).errors);
}

export function validateStrategyObservationProcessingContract(contract) {
  const errors = [];

  if (!contract || typeof contract !== "object" || Array.isArray(contract)) {
    return { ok: false, errors: ["StrategyObservationProcessingContract must be a JSON object"] };
  }
  validateForbiddenFields(errors, contract);
  for (const field of requiredFields) {
    if (!Object.hasOwn(contract, field)) errors.push(`${field} is required`);
  }
  validateCoreFields(errors, contract);
  validateIdShapes(errors, contract);
  validateDeterministicId(errors, contract);
  validateAllowedInputs(errors, contract.allowed_processing_inputs);
  validateAllowedOutputs(errors, contract.allowed_processing_outputs);
  validateForbiddenOutputs(errors, contract.forbidden_processing_outputs);
  validateProcessingRules(errors, contract.processing_rules);

  return { ok: errors.length === 0, errors };
}

export function formatStrategyObservationProcessingContractValidationReport(report) {
  const lines = [
    "Overlord StrategyObservationProcessingContract Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) lines.push(`ERROR ${error}`);
  return lines.join("\n");
}

function validateCoreFields(errors, contract) {
  if (contract.schema_version !== "strategy_observation_processing_contract.v1") errors.push("schema_version must be strategy_observation_processing_contract.v1");
  if (Number.isNaN(Date.parse(contract.generated_at))) errors.push("generated_at must be a valid timestamp");
  if (contract.paper_only !== true) errors.push("paper_only must be true");
  if (contract.live_execution_allowed !== false) errors.push("live_execution_allowed must be false");
  if (contract.order_placement_allowed !== false) errors.push("order_placement_allowed must be false");
  if (contract.replay_mode !== "offline_fixture_replay") errors.push("replay_mode is invalid");
  if (!allowedRunModes.has(contract.run_mode)) errors.push("run_mode is invalid");
  if (!allowedStatuses.has(contract.status)) errors.push("status is invalid");
}

function validateIdShapes(errors, contract) {
  if (typeof contract.strategy_observation_processing_contract_id !== "string" || !contract.strategy_observation_processing_contract_id.startsWith("sopc_")) errors.push("strategy_observation_processing_contract_id must reference a StrategyObservationProcessingContract id");
  if (typeof contract.strategy_definition_id !== "string" || !contract.strategy_definition_id.startsWith("sdef_")) errors.push("strategy_definition_id must reference a StrategyDefinition id");
  if (typeof contract.strategy_run_intent_id !== "string" || !contract.strategy_run_intent_id.startsWith("sri_")) errors.push("strategy_run_intent_id must reference a StrategyRunIntent id");
  if (typeof contract.strategy_observation_stack_closeout_checkpoint_id !== "string" || !contract.strategy_observation_stack_closeout_checkpoint_id.startsWith("soscc_")) errors.push("strategy_observation_stack_closeout_checkpoint_id must reference a StrategyObservationStackCloseoutCheckpoint id");
  if (contract.source_strategy_observation_stack_closeout_checkpoint_id !== contract.strategy_observation_stack_closeout_checkpoint_id) errors.push("source_strategy_observation_stack_closeout_checkpoint_id must match strategy_observation_stack_closeout_checkpoint_id");
  if (typeof contract.source_strategy_observation_case_file_summary_id !== "string" || !contract.source_strategy_observation_case_file_summary_id.startsWith("socfs_")) errors.push("source_strategy_observation_case_file_summary_id must reference a StrategyObservationCaseFileSummary id");
  if (typeof contract.source_strategy_observation_evidence_bundle_id !== "string" || !contract.source_strategy_observation_evidence_bundle_id.startsWith("soeb_")) errors.push("source_strategy_observation_evidence_bundle_id must reference a StrategyObservationEvidenceBundle id");
  if (typeof contract.source_strategy_observation_noop_summary_id !== "string" || !contract.source_strategy_observation_noop_summary_id.startsWith("sons_")) errors.push("source_strategy_observation_noop_summary_id must reference a StrategyObservationNoOpSummary id");
  if (contract.source_strategy_definition_id !== contract.strategy_definition_id) errors.push("source_strategy_definition_id must match strategy_definition_id");
  if (contract.source_strategy_run_intent_id !== contract.strategy_run_intent_id) errors.push("source_strategy_run_intent_id must match strategy_run_intent_id");
}

function validateDeterministicId(errors, contract) {
  const expected = strategyObservationProcessingContractId({
    strategyDefinitionId: contract.strategy_definition_id,
    strategyRunIntentId: contract.strategy_run_intent_id,
    strategyObservationStackCloseoutCheckpointId: contract.strategy_observation_stack_closeout_checkpoint_id,
    allowedProcessingInputCount: Array.isArray(contract.allowed_processing_inputs) ? contract.allowed_processing_inputs.length : undefined,
    allowedProcessingOutputCount: Array.isArray(contract.allowed_processing_outputs) ? contract.allowed_processing_outputs.length : undefined,
    forbiddenProcessingOutputCount: Array.isArray(contract.forbidden_processing_outputs) ? contract.forbidden_processing_outputs.length : undefined
  });
  if (contract.strategy_observation_processing_contract_id !== expected) errors.push("strategy_observation_processing_contract_id must be deterministic from observation processing source ids and contract counts");
}

function validateAllowedInputs(errors, inputs) {
  validateKnownUniqueArray(errors, inputs, allowedInputSet, "allowed_processing_inputs", "input");
}

function validateAllowedOutputs(errors, outputs) {
  validateKnownUniqueArray(errors, outputs, allowedOutputSet, "allowed_processing_outputs", "output");
}

function validateKnownUniqueArray(errors, values, allowedSet, label, noun) {
  if (!Array.isArray(values) || values.length === 0) {
    errors.push(`${label} must be a non-empty array`);
    return;
  }
  const seen = new Set();
  for (const value of values) {
    if (!allowedSet.has(value)) errors.push(`${label} contains invalid ${noun}`);
    if (seen.has(value)) errors.push(`duplicate ${label} are not allowed`);
    seen.add(value);
  }
}

function validateForbiddenOutputs(errors, outputs) {
  if (!Array.isArray(outputs) || outputs.length === 0) {
    errors.push("forbidden_processing_outputs must be a non-empty array");
    return;
  }
  for (const output of requiredForbiddenProcessingOutputs) {
    if (!outputs.includes(output)) errors.push(`forbidden_processing_outputs must include ${output}`);
  }
}

function validateProcessingRules(errors, rules) {
  if (!Array.isArray(rules) || rules.length === 0) {
    errors.push("processing_rules must be a non-empty array");
    return;
  }
  const seen = new Set();
  for (const rule of rules) {
    if (!allowedRuleSet.has(rule)) errors.push("processing_rules contains invalid rule");
    if (forbiddenRules.has(rule)) errors.push("processing_rules contains forbidden rule");
    if (seen.has(rule)) errors.push("duplicate processing_rules are not allowed");
    seen.add(rule);
  }
}

function makeReport(filePath, errors) {
  return { ok: errors.length === 0, filePath: path.relative(repoRoot, filePath).replaceAll("\\", "/"), errors };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const explicitPath = process.argv.find((arg) => arg.endsWith(".json"));
  const report = await validateStrategyObservationProcessingContractFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatStrategyObservationProcessingContractValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
