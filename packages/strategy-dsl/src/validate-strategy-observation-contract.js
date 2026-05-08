import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { validateForbiddenFields } from "./strategy-contract-rules.js";
import {
  allowedObservationInputs,
  allowedObservationRules,
  requiredForbiddenObservationOutputs
} from "./build-strategy-observation-contract.js";
import { strategyObservationContractId } from "./strategy-observation-contract-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_contract.json");
const requiredFields = [
  "strategy_observation_contract_id",
  "schema_version",
  "generated_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "strategy_definition_id",
  "strategy_run_intent_id",
  "strategy_dry_run_stack_closeout_checkpoint_id",
  "source_strategy_dry_run_stack_closeout_checkpoint_id",
  "source_strategy_dry_run_case_file_summary_id",
  "source_strategy_dry_run_evidence_bundle_id",
  "source_strategy_dry_run_trace_ids",
  "source_strategy_definition_id",
  "source_strategy_run_intent_id",
  "replay_mode",
  "run_mode",
  "allowed_observation_inputs",
  "forbidden_observation_outputs",
  "observation_rules",
  "status",
  "reason"
];
const allowedStatuses = new Set(["strategy_observation_contract_ready", "strategy_observation_contract_rejected"]);
const allowedRunModes = new Set(["validation_only", "dry_run_planned"]);
const allowedInputSet = new Set(allowedObservationInputs);
const allowedRuleSet = new Set(allowedObservationRules);
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
  "place_order",
  "connect_external"
]);

export async function validateStrategyObservationContractFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let contract;
  try {
    contract = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, validateStrategyObservationContract(contract).errors);
}

export function validateStrategyObservationContract(contract) {
  const errors = [];

  if (!contract || typeof contract !== "object" || Array.isArray(contract)) {
    return { ok: false, errors: ["StrategyObservationContract must be a JSON object"] };
  }
  validateForbiddenFields(errors, contract);
  for (const field of requiredFields) {
    if (!Object.hasOwn(contract, field)) errors.push(`${field} is required`);
  }
  validateCoreFields(errors, contract);
  validateIdShapes(errors, contract);
  validateDeterministicId(errors, contract);
  validateAllowedInputs(errors, contract.allowed_observation_inputs);
  validateForbiddenOutputs(errors, contract.forbidden_observation_outputs);
  validateObservationRules(errors, contract.observation_rules);

  return { ok: errors.length === 0, errors };
}

export function formatStrategyObservationContractValidationReport(report) {
  const lines = [
    "Overlord StrategyObservationContract Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) lines.push(`ERROR ${error}`);
  return lines.join("\n");
}

function validateCoreFields(errors, contract) {
  if (contract.schema_version !== "strategy_observation_contract.v1") errors.push("schema_version must be strategy_observation_contract.v1");
  if (Number.isNaN(Date.parse(contract.generated_at))) errors.push("generated_at must be a valid timestamp");
  if (contract.paper_only !== true) errors.push("paper_only must be true");
  if (contract.live_execution_allowed !== false) errors.push("live_execution_allowed must be false");
  if (contract.order_placement_allowed !== false) errors.push("order_placement_allowed must be false");
  if (contract.replay_mode !== "offline_fixture_replay") errors.push("replay_mode is invalid");
  if (!allowedRunModes.has(contract.run_mode)) errors.push("run_mode is invalid");
  if (!allowedStatuses.has(contract.status)) errors.push("status is invalid");
}

function validateIdShapes(errors, contract) {
  if (typeof contract.strategy_observation_contract_id !== "string" || !contract.strategy_observation_contract_id.startsWith("soc_")) errors.push("strategy_observation_contract_id must reference a StrategyObservationContract id");
  if (typeof contract.strategy_definition_id !== "string" || !contract.strategy_definition_id.startsWith("sdef_")) errors.push("strategy_definition_id must reference a StrategyDefinition id");
  if (typeof contract.strategy_run_intent_id !== "string" || !contract.strategy_run_intent_id.startsWith("sri_")) errors.push("strategy_run_intent_id must reference a StrategyRunIntent id");
  if (typeof contract.strategy_dry_run_stack_closeout_checkpoint_id !== "string" || !contract.strategy_dry_run_stack_closeout_checkpoint_id.startsWith("sdrscc_")) errors.push("strategy_dry_run_stack_closeout_checkpoint_id must reference a StrategyDryRunStackCloseoutCheckpoint id");
  if (contract.source_strategy_dry_run_stack_closeout_checkpoint_id !== contract.strategy_dry_run_stack_closeout_checkpoint_id) errors.push("source_strategy_dry_run_stack_closeout_checkpoint_id must match strategy_dry_run_stack_closeout_checkpoint_id");
  if (typeof contract.source_strategy_dry_run_case_file_summary_id !== "string" || !contract.source_strategy_dry_run_case_file_summary_id.startsWith("sdrcfs_")) errors.push("source_strategy_dry_run_case_file_summary_id must reference a StrategyDryRunCaseFileSummary id");
  if (typeof contract.source_strategy_dry_run_evidence_bundle_id !== "string" || !contract.source_strategy_dry_run_evidence_bundle_id.startsWith("sdreb_")) errors.push("source_strategy_dry_run_evidence_bundle_id must reference a StrategyDryRunEvidenceBundle id");
  if (!Array.isArray(contract.source_strategy_dry_run_trace_ids) || contract.source_strategy_dry_run_trace_ids.length === 0) {
    errors.push("source_strategy_dry_run_trace_ids must be a non-empty array");
  } else {
    for (const traceId of contract.source_strategy_dry_run_trace_ids) {
      if (typeof traceId !== "string" || !traceId.startsWith("sdrt_")) errors.push("source_strategy_dry_run_trace_ids must reference StrategyDryRunTrace ids");
    }
  }
  if (contract.source_strategy_definition_id !== contract.strategy_definition_id) errors.push("source_strategy_definition_id must match strategy_definition_id");
  if (contract.source_strategy_run_intent_id !== contract.strategy_run_intent_id) errors.push("source_strategy_run_intent_id must match strategy_run_intent_id");
}

function validateDeterministicId(errors, contract) {
  const expected = strategyObservationContractId({
    strategyDefinitionId: contract.strategy_definition_id,
    strategyRunIntentId: contract.strategy_run_intent_id,
    strategyDryRunStackCloseoutCheckpointId: contract.strategy_dry_run_stack_closeout_checkpoint_id,
    allowedObservationInputCount: Array.isArray(contract.allowed_observation_inputs) ? contract.allowed_observation_inputs.length : undefined,
    forbiddenObservationOutputCount: Array.isArray(contract.forbidden_observation_outputs) ? contract.forbidden_observation_outputs.length : undefined
  });
  if (contract.strategy_observation_contract_id !== expected) errors.push("strategy_observation_contract_id must be deterministic from observation source ids and contract counts");
}

function validateAllowedInputs(errors, inputs) {
  if (!Array.isArray(inputs) || inputs.length === 0) {
    errors.push("allowed_observation_inputs must be a non-empty array");
    return;
  }
  const seen = new Set();
  for (const input of inputs) {
    if (!allowedInputSet.has(input)) errors.push("allowed_observation_inputs contains invalid input");
    if (seen.has(input)) errors.push("duplicate allowed_observation_inputs are not allowed");
    seen.add(input);
  }
}

function validateForbiddenOutputs(errors, outputs) {
  if (!Array.isArray(outputs) || outputs.length === 0) {
    errors.push("forbidden_observation_outputs must be a non-empty array");
    return;
  }
  for (const output of requiredForbiddenObservationOutputs) {
    if (!outputs.includes(output)) errors.push(`forbidden_observation_outputs must include ${output}`);
  }
}

function validateObservationRules(errors, rules) {
  if (!Array.isArray(rules) || rules.length === 0) {
    errors.push("observation_rules must be a non-empty array");
    return;
  }
  const seen = new Set();
  for (const rule of rules) {
    if (!allowedRuleSet.has(rule)) errors.push("observation_rules contains invalid rule");
    if (forbiddenRules.has(rule)) errors.push("observation_rules contains forbidden rule");
    if (seen.has(rule)) errors.push("duplicate observation_rules are not allowed");
    seen.add(rule);
  }
}

function makeReport(filePath, errors) {
  return { ok: errors.length === 0, filePath: path.relative(repoRoot, filePath).replaceAll("\\", "/"), errors };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const explicitPath = process.argv.find((arg) => arg.endsWith(".json"));
  const report = await validateStrategyObservationContractFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatStrategyObservationContractValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
