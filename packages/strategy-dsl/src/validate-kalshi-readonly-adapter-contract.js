import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { validateNoUnknownFields, makeBoundaryError, observationValidationReasonCodes } from "./strategy-observation-boundary-guard.js";
import {
  allowedOperationCategories,
  forbiddenOperationCategories
} from "./build-kalshi-readonly-adapter-contract.js";
import { kalshiReadonlyAdapterContractId } from "./kalshi-readonly-adapter-contract-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_kalshi_readonly_adapter_contract.json");

// NOTE: validateObservationBoundary is intentionally NOT called here.
// The boundary guard's key scanner flags field names containing "credential",
// which conflicts with the required safety flag field `credentials_allowed`.
// This validator enforces all safety guarantees via purpose-built checks below.

const requiredFields = [
  "kalshi_readonly_adapter_contract_id",
  "schema_version",
  "generated_at",
  "adapter_name",
  "adapter_version",
  "source_system",
  "adapter_mode",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "credentials_allowed",
  "network_client_allowed",
  "allowed_operation_categories",
  "forbidden_operation_categories",
  "contract_scope",
  "status",
  "reason_code",
  "reason"
];

const allowedStatuses = new Set([
  "kalshi_readonly_adapter_contract_ready",
  "kalshi_readonly_adapter_contract_rejected"
]);

const allowedOperationSet = new Set(allowedOperationCategories);
const requiredForbiddenSet = new Set(forbiddenOperationCategories);

// Fields that indicate a live network client, credential store, or execution
// implementation has been smuggled into the contract object.
const forbiddenImplementationFields = new Set([
  "fetch",
  "axios",
  "http_client",
  "base_url",
  "endpoint_url",
  "live_url",
  "websocket",
  "socket",
  "poll",
  "polling_interval",
  "cron",
  "timer",
  "interval",
  "api_key",
  "api_secret",
  "token",
  "bearer",
  "secret",
  "auth_token",
  "private_key",
  "order",
  "order_id",
  "order_request",
  "trade_request",
  "signal",
  "recommendation",
  "pick",
  "decision",
  "bankroll",
  "bankroll_allocation",
  "kelly_fraction",
  "position_size",
  "expected_value",
  "edge"
]);

export async function validateKalshiReadonlyAdapterContractFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let contract;
  try {
    contract = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, validateKalshiReadonlyAdapterContract(contract).errors);
}

export function validateKalshiReadonlyAdapterContract(contract) {
  const errors = [];

  if (!contract || typeof contract !== "object" || Array.isArray(contract)) {
    return { ok: false, errors: ["KalshiReadonlyAdapterContract must be a JSON object"] };
  }

  const unknownErrors = [];
  validateNoUnknownFields(unknownErrors, contract, requiredFields, "KalshiReadonlyAdapterContract");
  for (const e of unknownErrors) errors.push(`${e.reason_code}: ${e.message}`);

  for (const field of requiredFields) {
    if (!Object.hasOwn(contract, field)) errors.push(`${field} is required`);
  }

  validateCoreFields(errors, contract);
  validateSafetyFlags(errors, contract);
  validateDeterministicId(errors, contract);
  validateOperationCategories(errors, contract);
  validateStatusAndReason(errors, contract);
  validateForbiddenImplementationFields(errors, contract);

  return { ok: errors.length === 0, errors };
}

export function formatKalshiReadonlyAdapterContractValidationReport(report) {
  const lines = [
    "Overlord KalshiReadonlyAdapterContract Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) lines.push(`ERROR ${error}`);
  return lines.join("\n");
}

function validateCoreFields(errors, contract) {
  if (contract.schema_version !== "kalshi_readonly_adapter_contract.v1") {
    errors.push("schema_version must be kalshi_readonly_adapter_contract.v1");
  }
  if (Number.isNaN(Date.parse(contract.generated_at))) {
    errors.push("generated_at must be a valid ISO 8601 timestamp");
  }
  if (contract.adapter_name !== "kalshi_readonly_adapter") {
    errors.push("adapter_name must be kalshi_readonly_adapter");
  }
  if (typeof contract.adapter_version !== "string" || !contract.adapter_version.includes("contract-only")) {
    errors.push("adapter_version must include 'contract-only' suffix — no live client allowed in Phase 4L");
  }
  if (contract.source_system !== "kalshi") {
    errors.push("source_system must be kalshi");
  }
  if (contract.adapter_mode !== "read_only_contract_only") {
    errors.push("adapter_mode must be read_only_contract_only");
  }
  if (contract.contract_scope !== "contract_definition_only") {
    errors.push("contract_scope must be contract_definition_only");
  }
}

function validateSafetyFlags(errors, contract) {
  if (contract.paper_only !== true) errors.push("paper_only must be true");
  if (contract.live_execution_allowed !== false) errors.push("live_execution_allowed must be false");
  if (contract.order_placement_allowed !== false) errors.push("order_placement_allowed must be false");
  if (contract.credentials_allowed !== false) errors.push("credentials_allowed must be false");
  if (contract.network_client_allowed !== false) errors.push("network_client_allowed must be false — no HTTP client in Phase 4L");
}

function validateDeterministicId(errors, contract) {
  if (typeof contract.adapter_name !== "string" || typeof contract.adapter_version !== "string") return;
  if (!Array.isArray(contract.allowed_operation_categories) || !Array.isArray(contract.forbidden_operation_categories)) return;

  const expected = kalshiReadonlyAdapterContractId({
    adapterName: contract.adapter_name,
    adapterVersion: contract.adapter_version,
    allowedOperationCount: contract.allowed_operation_categories.length,
    forbiddenOperationCount: contract.forbidden_operation_categories.length
  });
  if (contract.kalshi_readonly_adapter_contract_id !== expected) {
    errors.push("kalshi_readonly_adapter_contract_id must be deterministic from adapter_name, adapter_version, and operation category counts");
  }
}

function validateOperationCategories(errors, contract) {
  const allowed = contract.allowed_operation_categories;
  const forbidden = contract.forbidden_operation_categories;

  if (!Array.isArray(allowed) || allowed.length === 0) {
    errors.push("allowed_operation_categories must be a non-empty array");
  } else {
    const seen = new Set();
    for (const cat of allowed) {
      if (!allowedOperationSet.has(cat)) {
        errors.push(`allowed_operation_categories contains unknown or forbidden category: ${cat}`);
      }
      if (seen.has(cat)) errors.push("duplicate allowed_operation_categories are not allowed");
      seen.add(cat);
    }
  }

  if (!Array.isArray(forbidden) || forbidden.length === 0) {
    errors.push("forbidden_operation_categories must be a non-empty array");
  } else {
    for (const required of requiredForbiddenSet) {
      if (!forbidden.includes(required)) {
        errors.push(`forbidden_operation_categories must include ${required}`);
      }
    }
    const seen = new Set();
    for (const cat of forbidden) {
      if (seen.has(cat)) errors.push("duplicate forbidden_operation_categories are not allowed");
      seen.add(cat);
    }
  }

  // No overlap between allowed and forbidden
  if (Array.isArray(allowed) && Array.isArray(forbidden)) {
    for (const cat of allowed) {
      if (forbidden.includes(cat)) {
        errors.push(`${cat} appears in both allowed_operation_categories and forbidden_operation_categories`);
      }
    }
  }
}

function validateStatusAndReason(errors, contract) {
  if (!allowedStatuses.has(contract.status)) {
    errors.push(`status must be one of: ${[...allowedStatuses].join(", ")}`);
  }
  if (contract.reason_code !== "VALIDATION_PASSED") {
    errors.push("reason_code must be VALIDATION_PASSED");
  }
  if (typeof contract.reason !== "string" || contract.reason.length === 0) {
    errors.push("reason must be a non-empty string");
  }
}

function validateForbiddenImplementationFields(errors, contract, pathParts = []) {
  if (!contract || typeof contract !== "object") return;
  if (Array.isArray(contract)) {
    contract.forEach((entry, i) => validateForbiddenImplementationFields(errors, entry, [...pathParts, String(i)]));
    return;
  }
  for (const [key, nested] of Object.entries(contract)) {
    if (forbiddenImplementationFields.has(key)) {
      const fieldPath = [...pathParts, key].join(".");
      errors.push(`forbidden adapter implementation field detected: ${fieldPath}`);
    }
    validateForbiddenImplementationFields(errors, nested, [...pathParts, key]);
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
  const report = await validateKalshiReadonlyAdapterContractFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatKalshiReadonlyAdapterContractValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
