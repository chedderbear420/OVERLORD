import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { validateNoUnknownFields } from "./strategy-observation-boundary-guard.js";
import { kalshiStrategySignalDefinitionId } from "./kalshi-strategy-signal-definition-id.js";
import {
  APPROVED_INPUT_FIELDS,
  APPROVED_THRESHOLD_NAMES,
  APPROVED_VALUE_TYPES,
  APPROVED_COMPARISONS,
} from "./build-kalshi-strategy-signal-definition.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(
  repoRoot,
  "packages",
  "strategy-dsl",
  "fixtures",
  "synthetic_kalshi_strategy_signal_definition.json"
);

const requiredFields = [
  "kalshi_strategy_signal_definition_id",
  "schema_version",
  "generated_at",
  "definition_name",
  "definition_version",
  "definition_mode",
  "source_artifact_type",
  "source_schema_version",
  "source_phase",
  "allowed_input_fields",
  "condition_family",
  "threshold_definitions",
  "output_contract",
  "forbidden_outputs",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "credentials_used",
  "network_request_used",
  "evaluation_allowed",
  "reason_code",
  "reason",
];

// Required entries in forbidden_outputs
const requiredForbiddenOutputs = new Set([
  "signal_event",
  "pick",
  "recommendation",
  "decision",
  "order",
  "trade",
  "execution",
  "bankroll",
  "position_size",
  "expected_value",
  "edge",
  "pnl",
  "paper_ledger_entry",
]);

// Field names that must never appear at any depth.
const forbiddenImplementationFields = new Set([
  "signal", "signal_event",
  "pick", "recommendation", "decision",
  "order", "trade", "execution",
  "bankroll", "position_size", "expected_value", "edge", "pnl", "profit",
  "buy", "sell", "bet", "wager", "stake", "kelly",
  "api_key", "token", "secret", "credential", "credentials",
  "fetch", "axios", "websocket", "polling", "cron",
]);

// Free-text fields subject to string-value scanning (exempt structural/ID fields).
const exemptFromStringValueScan = new Set([
  "kalshi_strategy_signal_definition_id",
  "schema_version",
  "generated_at",
  "definition_name",
  "definition_version",
  "definition_mode",
  "source_artifact_type",
  "source_schema_version",
  "source_phase",
  "allowed_input_fields",
  "condition_family",
  "threshold_definitions",      // array — threshold_name/value_type/comparison exempt via top-level key
  "output_contract",            // object — evaluation_phase_required exempt via top-level key
  "forbidden_outputs",          // array of string enum values
  "reason_code",
]);

// Word-boundary-aware patterns for forbidden language in free-text strings.
const forbiddenStringValuePatterns = [
  { pattern: /\bbuy\b/iu, label: "buy" },
  { pattern: /\bsell\b/iu, label: "sell" },
  { pattern: /\bplace[\s_]order\b/iu, label: "place order" },
  { pattern: /\borders?\b/iu, label: "order" },
  { pattern: /\btrades?\b|\btrading\b/iu, label: "trade" },
  { pattern: /\bexecut(?:e|ion|ing)\b/iu, label: "execution" },
  { pattern: /\bpicks?\b/iu, label: "pick" },
  { pattern: /\brecommendations?\b/iu, label: "recommendation" },
  { pattern: /\bdecisions?\b/iu, label: "decision" },
  { pattern: /\bbankroll\b/iu, label: "bankroll" },
  { pattern: /\bposition[\s_]size\b/iu, label: "position size" },
  { pattern: /\bexpected[\s_]value\b/iu, label: "expected value" },
  { pattern: /\bedge\b/iu, label: "edge" },
  { pattern: /\bprofit\b/iu, label: "profit" },
  { pattern: /\bpnl\b/iu, label: "pnl" },
  { pattern: /\bapi[\s_]key\b/iu, label: "api key" },
  { pattern: /\btoken\b/iu, label: "token" },
  { pattern: /\bsecret\b/iu, label: "secret" },
  { pattern: /\bcredentials?\b/iu, label: "credential" },
  { pattern: /\blive[\s_]execution\b/iu, label: "live execution" },
  { pattern: /\btrading[\s_]signal\b/iu, label: "trading signal" },
  { pattern: /\bgenerate[\s_]signal\b/iu, label: "generate signal" },
  { pattern: /\bemit[\s_]signal\b/iu, label: "emit signal" },
  { pattern: /\bbuy[\s_]signal\b/iu, label: "buy signal" },
  { pattern: /\bsell[\s_]signal\b/iu, label: "sell signal" },
];

// ─── Public API ──────────────────────────────────────────────────────────────

export async function validateKalshiStrategySignalDefinitionFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let def;
  try {
    def = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, validateKalshiStrategySignalDefinition(def).errors);
}

export function validateKalshiStrategySignalDefinition(def) {
  const errors = [];

  if (!def || typeof def !== "object" || Array.isArray(def)) {
    return { ok: false, errors: ["KalshiStrategySignalDefinition must be a JSON object"] };
  }

  // Field whitelist
  const unknownErrors = [];
  validateNoUnknownFields(unknownErrors, def, requiredFields, "KalshiStrategySignalDefinition");
  for (const e of unknownErrors) errors.push(`${e.reason_code}: ${e.message}`);

  for (const field of requiredFields) {
    if (!Object.hasOwn(def, field)) errors.push(`${field} is required`);
  }

  validateCoreFields(errors, def);
  validateSafetyFlags(errors, def);
  validateDeterministicId(errors, def);
  validateInputFields(errors, def);
  validateThresholdDefinitions(errors, def);
  validateOutputContract(errors, def);
  validateForbiddenOutputs(errors, def);
  validateForbiddenImplementationFields(errors, def);
  validateForbiddenStringValues(errors, def);

  return { ok: errors.length === 0, errors };
}

export function formatKalshiStrategySignalDefinitionValidationReport(report) {
  const lines = [
    "Overlord KalshiStrategySignalDefinition Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`,
  ];
  for (const error of report.errors) lines.push(`ERROR ${error}`);
  return lines.join("\n");
}

// ─── Validation helpers ───────────────────────────────────────────────────────

function validateCoreFields(errors, def) {
  if (def.schema_version !== "kalshi_strategy_signal_definition.v1") {
    errors.push("schema_version must be kalshi_strategy_signal_definition.v1");
  }
  if (!def.generated_at || Number.isNaN(Date.parse(def.generated_at))) {
    errors.push("generated_at must be a valid ISO 8601 timestamp");
  }
  if (def.definition_mode !== "definition_only") {
    errors.push("definition_mode must be definition_only");
  }
  if (def.source_artifact_type !== "kalshi_market_snapshot") {
    errors.push("source_artifact_type must be kalshi_market_snapshot");
  }
  if (def.source_schema_version !== "kalshi_market_snapshot.v1") {
    errors.push("source_schema_version must be kalshi_market_snapshot.v1");
  }
  if (def.source_phase !== "Phase 4M") {
    errors.push("source_phase must be Phase 4M");
  }
  if (typeof def.definition_name !== "string" || def.definition_name.length === 0) {
    errors.push("definition_name must be a non-empty string");
  }
  if (typeof def.definition_version !== "string" || def.definition_version.length === 0) {
    errors.push("definition_version must be a non-empty string");
  }
  if (typeof def.condition_family !== "string" || def.condition_family.length === 0) {
    errors.push("condition_family must be a non-empty string");
  }
  if (def.reason_code !== "DEFINITION_CONTRACT_READY") {
    errors.push("reason_code must be DEFINITION_CONTRACT_READY");
  }
  if (typeof def.reason !== "string" || def.reason.length === 0) {
    errors.push("reason must be a non-empty string");
  }
}

function validateSafetyFlags(errors, def) {
  if (def.paper_only !== true) errors.push("paper_only must be true");
  if (def.live_execution_allowed !== false) errors.push("live_execution_allowed must be false");
  if (def.order_placement_allowed !== false) errors.push("order_placement_allowed must be false");
  if (def.credentials_used !== false) errors.push("credentials_used must be false");
  if (def.network_request_used !== false) errors.push("network_request_used must be false");
  if (def.evaluation_allowed !== false) {
    errors.push("evaluation_allowed must be false — Phase 4N defines the contract only; evaluation requires Phase 4O");
  }
}

function validateDeterministicId(errors, def) {
  if (
    typeof def.definition_name !== "string" ||
    typeof def.definition_version !== "string" ||
    typeof def.source_artifact_type !== "string" ||
    typeof def.source_schema_version !== "string" ||
    typeof def.definition_mode !== "string"
  ) return;

  const expected = kalshiStrategySignalDefinitionId({
    definitionName: def.definition_name,
    definitionVersion: def.definition_version,
    sourceArtifactType: def.source_artifact_type,
    sourceSchemaVersion: def.source_schema_version,
    definitionMode: def.definition_mode,
  });
  if (def.kalshi_strategy_signal_definition_id !== expected) {
    errors.push(
      "kalshi_strategy_signal_definition_id must be deterministic from definition_name, definition_version, source_artifact_type, source_schema_version, definition_mode"
    );
  }
}

function validateInputFields(errors, def) {
  if (!Array.isArray(def.allowed_input_fields)) {
    errors.push("allowed_input_fields must be an array");
    return;
  }
  for (const field of def.allowed_input_fields) {
    if (!APPROVED_INPUT_FIELDS.has(field)) {
      errors.push(`allowed_input_fields contains unapproved field: ${field}`);
    }
  }
}

function validateThresholdDefinitions(errors, def) {
  if (!Array.isArray(def.threshold_definitions)) {
    errors.push("threshold_definitions must be an array");
    return;
  }
  for (let i = 0; i < def.threshold_definitions.length; i++) {
    const t = def.threshold_definitions[i];
    if (!t || typeof t !== "object") {
      errors.push(`threshold_definitions[${i}] must be an object`);
      continue;
    }
    if (!APPROVED_THRESHOLD_NAMES.has(t.threshold_name)) {
      errors.push(`threshold_definitions[${i}].threshold_name "${t.threshold_name}" is not approved`);
    }
    if (!APPROVED_VALUE_TYPES.has(t.value_type)) {
      errors.push(`threshold_definitions[${i}].value_type "${t.value_type}" is not approved`);
    }
    if (!APPROVED_COMPARISONS.has(t.comparison)) {
      errors.push(`threshold_definitions[${i}].comparison "${t.comparison}" is not approved`);
    }
    if (typeof t.required_for_evaluation !== "boolean") {
      errors.push(`threshold_definitions[${i}].required_for_evaluation must be a boolean`);
    }
  }
}

function validateOutputContract(errors, def) {
  const oc = def.output_contract;
  if (!oc || typeof oc !== "object" || Array.isArray(oc)) {
    errors.push("output_contract must be an object");
    return;
  }
  const flags = [
    "emits_signal_events",
    "emits_recommendations",
    "emits_decisions",
    "emits_orders",
    "emits_paper_ledger_entries",
  ];
  for (const flag of flags) {
    if (oc[flag] !== false) {
      errors.push(`output_contract.${flag} must be false — Phase 4N emits nothing`);
    }
  }
  if (oc.evaluation_phase_required !== "Phase 4O") {
    errors.push("output_contract.evaluation_phase_required must be Phase 4O");
  }
}

function validateForbiddenOutputs(errors, def) {
  if (!Array.isArray(def.forbidden_outputs)) {
    errors.push("forbidden_outputs must be an array");
    return;
  }
  const present = new Set(def.forbidden_outputs);
  for (const required of requiredForbiddenOutputs) {
    if (!present.has(required)) {
      errors.push(`forbidden_outputs must include "${required}"`);
    }
  }
}

function validateForbiddenImplementationFields(errors, value, pathParts = []) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, i) =>
      validateForbiddenImplementationFields(errors, item, [...pathParts, String(i)])
    );
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenImplementationFields.has(key)) {
      const fieldPath = [...pathParts, key].join(".");
      errors.push(`forbidden signal definition field detected: ${fieldPath}`);
    }
    validateForbiddenImplementationFields(errors, nested, [...pathParts, key]);
  }
}

function validateForbiddenStringValues(errors, value, pathParts = []) {
  if (pathParts.length > 0 && exemptFromStringValueScan.has(pathParts[0])) return;

  if (typeof value === "string") {
    const fieldPath = pathParts.join(".") || "<root>";
    for (const { pattern, label } of forbiddenStringValuePatterns) {
      if (pattern.test(value)) {
        errors.push(
          `forbidden signal definition string value at ${fieldPath}: contains "${label}"`
        );
        break;
      }
    }
  } else if (Array.isArray(value)) {
    value.forEach((item, i) =>
      validateForbiddenStringValues(errors, item, [...pathParts, String(i)])
    );
  } else if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      validateForbiddenStringValues(errors, nested, [...pathParts, key]);
    }
  }
}

function makeReport(filePath, errors) {
  return {
    ok: errors.length === 0,
    filePath: path.relative(repoRoot, filePath).replaceAll("\\", "/"),
    errors,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const explicitPath = process.argv.find((arg) => arg.endsWith(".json"));
  const report = await validateKalshiStrategySignalDefinitionFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath,
  });
  console.log(formatKalshiStrategySignalDefinitionValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
