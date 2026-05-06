import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import {
  allowedInputs,
  allowedStrategyStatuses,
  allowedStrategyTypes,
  hasAllRequiredForbiddenOutputs,
  validateForbiddenFields
} from "./strategy-contract-rules.js";
import { strategyDefinitionId } from "./strategy-definition-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_definition.json");
const requiredFields = [
  "strategy_definition_id",
  "schema_version",
  "created_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "strategy_name",
  "strategy_version",
  "strategy_type",
  "description",
  "allowed_inputs",
  "forbidden_outputs",
  "parameters",
  "status",
  "reason"
];

export async function validateStrategyDefinitionFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let definition;
  try {
    definition = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, validateStrategyDefinition(definition).errors);
}

export function validateStrategyDefinition(definition) {
  const errors = [];

  if (!definition || typeof definition !== "object" || Array.isArray(definition)) {
    return { ok: false, errors: ["StrategyDefinition must be a JSON object"] };
  }
  validateForbiddenFields(errors, definition);
  for (const field of requiredFields) {
    if (!Object.hasOwn(definition, field)) {
      errors.push(`${field} is required`);
    }
  }
  if (definition.schema_version !== "strategy_definition.v1") {
    errors.push("schema_version must be strategy_definition.v1");
  }
  if (Number.isNaN(Date.parse(definition.created_at))) {
    errors.push("created_at must be a valid timestamp");
  }
  if (definition.paper_only !== true) {
    errors.push("paper_only must be true");
  }
  if (definition.live_execution_allowed !== false) {
    errors.push("live_execution_allowed must be false");
  }
  if (definition.order_placement_allowed !== false) {
    errors.push("order_placement_allowed must be false");
  }
  if (!allowedStrategyTypes.has(definition.strategy_type)) {
    errors.push("strategy_type is invalid");
  }
  if (!allowedStrategyStatuses.has(definition.status)) {
    errors.push("status is invalid");
  }
  if (definition.strategy_definition_id !== strategyDefinitionId({
    strategyName: definition.strategy_name,
    strategyVersion: definition.strategy_version,
    strategyType: definition.strategy_type
  })) {
    errors.push("strategy_definition_id must be deterministic from strategy name, version, and type");
  }
  validateString(errors, definition.strategy_name, "strategy_name");
  validateString(errors, definition.strategy_version, "strategy_version");
  validateString(errors, definition.description, "description");
  validateAllowedInputs(errors, definition.allowed_inputs);
  validateForbiddenOutputs(errors, definition.forbidden_outputs);
  if (!definition.parameters || typeof definition.parameters !== "object" || Array.isArray(definition.parameters)) {
    errors.push("parameters must be an object");
  }

  return { ok: errors.length === 0, errors };
}

export function formatStrategyDefinitionValidationReport(report) {
  const lines = [
    "Overlord StrategyDefinition Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) {
    lines.push(`ERROR ${error}`);
  }
  return lines.join("\n");
}

function validateAllowedInputs(errors, allowedInputValues) {
  if (!Array.isArray(allowedInputValues) || allowedInputValues.length === 0) {
    errors.push("allowed_inputs must be a non-empty array");
    return;
  }
  const seen = new Set();
  for (const input of allowedInputValues) {
    if (!allowedInputs.has(input)) {
      errors.push("allowed_inputs may reference existing artifact categories only");
    }
    if (seen.has(input)) {
      errors.push("allowed_inputs must not contain duplicates");
    }
    seen.add(input);
  }
}

function validateForbiddenOutputs(errors, forbiddenOutputs) {
  if (!Array.isArray(forbiddenOutputs) || forbiddenOutputs.length === 0) {
    errors.push("forbidden_outputs must be a non-empty array");
    return;
  }
  if (!hasAllRequiredForbiddenOutputs(forbiddenOutputs)) {
    errors.push("forbidden_outputs must include all required live, credential, bankroll, and recommendation blocks");
  }
}

function validateString(errors, value, field) {
  if (typeof value !== "string" || value.length === 0) {
    errors.push(`${field} must be a non-empty string`);
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
  const report = await validateStrategyDefinitionFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatStrategyDefinitionValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
