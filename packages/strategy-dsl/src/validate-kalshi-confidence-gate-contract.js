/**
 * validate-kalshi-confidence-gate-contract.js
 *
 * Phase 5A — Validator for KalshiConfidenceGateContract.
 *
 * No file I/O in validate*. formatReport and validateFile are the only I/O entry points.
 * No network. No credentials. No env. Paper-only. Offline-safe.
 *
 * Exports:
 *   validateKalshiConfidenceGateContract(contract) -> { valid, errors }
 *   validateKalshiConfidenceGateContractFile(filePath) -> { valid, errors }
 *   formatKalshiConfidenceGateContractValidationReport({ filePath, valid, errors }) -> string
 */

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCHEMA_VERSION = "kalshi_confidence_gate_contract.v1";
const GATE_CONTRACT_MODE = "phase_5a_gate_contract_only";
const SOURCE_PHASE = "Phase 5A";
const OVERALL_GATE_STATUS = "blocked";
const REASON_CODE = "CONFIDENCE_GATES_DEFINED_BLOCKED";
const REQUIRED_GATE_COUNT = 5;

const REQUIRED_FIELDS = [
  "kalshi_confidence_gate_contract_id",
  "schema_version",
  "generated_at",
  "gate_contract_mode",
  "source_phase",
  "required_source_artifacts",
  "gates",
  "overall_gate_status",
  "phase_6_ready",
  "live_mode_allowed",
  "credentials_allowed",
  "order_placement_allowed",
  "autonomous_execution_allowed",
  "risk_governor_required",
  "operator_signoff_required",
  "operator_signoff_complete",
  "paper_only",
  "reason_code",
  "reason",
];

const ALLOWED_FIELDS = new Set(REQUIRED_FIELDS);

const REQUIRED_GATE_IDS = new Set([
  "signal_calibration",
  "edge_consistency",
  "paper_pnl",
  "risk_governor",
  "operator_signoff",
]);

const APPROVED_GATE_STATUSES = new Set([
  "blocked",
  "requires_evidence",
  "not_evaluated",
]);

const FORBIDDEN_GATE_STATUSES = new Set([
  "passed",
  "approved",
  "ready",
  "live_ready",
  "complete",
]);

const REQUIRED_SOURCE_ARTIFACT_KEYS = new Set([
  "market_snapshot",
  "strategy_signal_definition",
  "signal_evaluation_summary",
  "paper_ledger_entry",
]);

const SOURCE_ARTIFACT_SCHEMA_VERSIONS = {
  market_snapshot: "kalshi_market_snapshot.v1",
  strategy_signal_definition: "kalshi_strategy_signal_definition.v1",
  signal_evaluation_summary: "kalshi_signal_evaluation_summary.v1",
  paper_ledger_entry: "kalshi_paper_ledger_entry.v1",
};

// Forbidden field names — exact key matching, recursive
const FORBIDDEN_FIELD_NAMES = new Set([
  "live_order",
  "order",
  "orders",
  "trade",
  "trades",
  "execution",
  "execute",
  "recommendation",
  "pick",
  "decision",
  "bankroll",
  "position_size",
  "kelly",
  "stake",
  "allocation",
  "api_key",
  "token",
  "secret",
  "credential",
  "credentials",
  "fetch",
  "axios",
  "websocket",
  "polling",
  "cron",
  "account",
  "balance",
  "portfolio",
  "live_position",
]);

// Structural safety field names approved — exempt from forbidden-field-name scan
const FIELD_NAME_EXEMPTIONS = new Set([
  "order_placement_allowed",
  "credentials_allowed",
  "autonomous_execution_allowed",
  "operator_signoff_required",
  "operator_signoff_complete",
  "risk_governor_required",
]);

// Top-level keys exempt from string-value scan
const STRING_SCAN_EXEMPT_TOP_LEVEL_KEYS = new Set([
  "kalshi_confidence_gate_contract_id",
  "schema_version",
  "generated_at",
  "gate_contract_mode",
  "source_phase",
  "overall_gate_status",
  "reason_code",
]);

// Gate sub-fields exempt from string-value scan
const GATE_EXEMPT_FIELDS = new Set([
  "gate_id",
  "gate_name",
  "gate_status",
  "required_before_phase",
  "minimum_requirements",
  "current_evidence_status",
]);

// Source artifact sub-field exempt from string-value scan
const SOURCE_ARTIFACT_EXEMPT_FIELDS = new Set(["schema_version"]);

// Forbidden string patterns (word-boundary, case-insensitive)
const FORBIDDEN_STRING_PATTERNS = [
  /\bbuy\b/i,
  /\bsell\b/i,
  /\bplace order\b/i,
  /\border\b/i,
  /\btrade\b/i,
  /\bexecute\b/i,
  /\bexecution\b/i,
  /\brecommendation\b/i,
  /\bpick\b/i,
  /\bdecision\b/i,
  /\bbankroll\b/i,
  /\bposition size\b/i,
  /\bstake\b/i,
  /\ballocation\b/i,
  /\bkelly\b/i,
  /\bapi key\b/i,
  /\btoken\b/i,
  /\bsecret\b/i,
  /\bcredential\b/i,
  /\blive order\b/i,
  /\blive position\b/i,
  /\bgo live\b/i,
  /\bapproved for live\b/i,
  /\bready for live\b/i,
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function computeExpectedId({ gateContractMode, sourcePhase, overallGateStatus }) {
  const digest = createHash("sha256")
    .update(
      [
        gateContractMode,
        SCHEMA_VERSION,
        sourcePhase,
        overallGateStatus,
        String(REQUIRED_GATE_COUNT),
      ].join("|")
    )
    .digest("hex")
    .slice(0, 32);
  return `kcgc_${digest}`;
}

function isValidIso8601(str) {
  if (typeof str !== "string") return false;
  const d = new Date(str);
  return !isNaN(d.getTime()) && str.includes("T");
}

// ---------------------------------------------------------------------------
// Forbidden field name scanner (recursive)
// ---------------------------------------------------------------------------

function validateNoForbiddenFieldNames(errors, obj, path = "") {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;
  for (const key of Object.keys(obj)) {
    if (!FIELD_NAME_EXEMPTIONS.has(key) && FORBIDDEN_FIELD_NAMES.has(key)) {
      errors.push(
        `forbidden field name "${key}" found at ${path || "top level"}`
      );
    }
    const child = obj[key];
    if (child && typeof child === "object") {
      if (Array.isArray(child)) {
        child.forEach((item, i) => {
          if (item && typeof item === "object") {
            validateNoForbiddenFieldNames(errors, item, `${path ? path + "." : ""}${key}[${i}]`);
          }
        });
      } else {
        validateNoForbiddenFieldNames(errors, child, `${path ? path + "." : ""}${key}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Forbidden string value scanner
// ---------------------------------------------------------------------------

function isExemptPath(topLevelKey, pathParts) {
  // Exempt top-level structural keys
  if (STRING_SCAN_EXEMPT_TOP_LEVEL_KEYS.has(topLevelKey)) return true;

  // Exempt required_source_artifacts.*.schema_version
  if (
    topLevelKey === "required_source_artifacts" &&
    pathParts.length >= 2 &&
    SOURCE_ARTIFACT_EXEMPT_FIELDS.has(pathParts[pathParts.length - 1])
  ) {
    return true;
  }

  // Exempt gates.*.gate_id / gate_name / gate_status / required_before_phase / minimum_requirements / current_evidence_status
  if (
    topLevelKey === "gates" &&
    pathParts.length >= 2 &&
    GATE_EXEMPT_FIELDS.has(pathParts[pathParts.length - 1])
  ) {
    return true;
  }

  return false;
}

function scanStringValues(errors, value, topLevelKey, pathParts = []) {
  if (typeof value === "string") {
    if (!isExemptPath(topLevelKey, pathParts)) {
      for (const pattern of FORBIDDEN_STRING_PATTERNS) {
        if (pattern.test(value)) {
          const fullPath = [topLevelKey, ...pathParts].join(".");
          errors.push(
            `forbidden string value matched pattern ${pattern} in field "${fullPath}": "${value}"`
          );
          break;
        }
      }
    }
  } else if (Array.isArray(value)) {
    value.forEach((item, i) => {
      scanStringValues(errors, item, topLevelKey, [...pathParts, String(i)]);
    });
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      scanStringValues(errors, v, topLevelKey, [...pathParts, k]);
    }
  }
}

function validateNoForbiddenStringValues(errors, contract) {
  for (const [key, value] of Object.entries(contract)) {
    scanStringValues(errors, value, key, []);
  }
}

// ---------------------------------------------------------------------------
// Gate validators
// ---------------------------------------------------------------------------

function validateGates(errors, gates) {
  if (!Array.isArray(gates) || gates.length === 0) {
    errors.push("gates must be a non-empty array");
    return;
  }

  const seenIds = new Set();

  for (const gate of gates) {
    const gateId = gate.gate_id;

    // Duplicate check
    if (seenIds.has(gateId)) {
      errors.push(`duplicate gate_id: "${gateId}"`);
    } else {
      seenIds.add(gateId);
    }

    // Unknown gate ID
    if (!REQUIRED_GATE_IDS.has(gateId)) {
      errors.push(`unknown gate_id: "${gateId}"`);
    }

    // gate_status
    if (!gate.gate_status) {
      errors.push(`gate "${gateId}": missing gate_status`);
    } else if (FORBIDDEN_GATE_STATUSES.has(gate.gate_status)) {
      errors.push(
        `gate "${gateId}": gate_status "${gate.gate_status}" is forbidden in Phase 5A`
      );
    } else if (!APPROVED_GATE_STATUSES.has(gate.gate_status)) {
      errors.push(
        `gate "${gateId}": gate_status "${gate.gate_status}" is not an approved value`
      );
    }

    // Required gate fields
    const requiredGateFields = [
      "gate_id",
      "gate_name",
      "gate_status",
      "required_before_phase",
      "evidence_required",
      "minimum_requirements",
      "current_evidence_status",
      "blocking_reason",
    ];
    for (const f of requiredGateFields) {
      if (!(f in gate)) {
        errors.push(`gate "${gateId}": missing required field "${f}"`);
      }
    }

    // minimum_requirements must be non-empty array
    if (
      !Array.isArray(gate.minimum_requirements) ||
      gate.minimum_requirements.length === 0
    ) {
      errors.push(
        `gate "${gateId}": minimum_requirements must be a non-empty array`
      );
    }
  }

  // All required gate IDs must be present
  for (const requiredId of REQUIRED_GATE_IDS) {
    if (!seenIds.has(requiredId)) {
      errors.push(`required gate_id "${requiredId}" is missing`);
    }
  }
}

// ---------------------------------------------------------------------------
// Source artifact validator
// ---------------------------------------------------------------------------

function validateRequiredSourceArtifacts(errors, rsa) {
  if (!rsa || typeof rsa !== "object" || Array.isArray(rsa)) {
    errors.push("required_source_artifacts must be an object");
    return;
  }

  for (const key of REQUIRED_SOURCE_ARTIFACT_KEYS) {
    if (!(key in rsa)) {
      errors.push(`required_source_artifacts: missing "${key}"`);
      continue;
    }
    const artifact = rsa[key];
    if (!artifact || typeof artifact !== "object") {
      errors.push(`required_source_artifacts.${key}: must be an object`);
      continue;
    }
    const expectedVersion = SOURCE_ARTIFACT_SCHEMA_VERSIONS[key];
    if (artifact.schema_version !== expectedVersion) {
      errors.push(
        `required_source_artifacts.${key}.schema_version must be "${expectedVersion}", got "${artifact.schema_version}"`
      );
    }
    if (artifact.required !== true) {
      errors.push(
        `required_source_artifacts.${key}.required must be true`
      );
    }
  }

  // No unknown keys
  for (const key of Object.keys(rsa)) {
    if (!REQUIRED_SOURCE_ARTIFACT_KEYS.has(key)) {
      errors.push(`required_source_artifacts: unknown key "${key}"`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main validator
// ---------------------------------------------------------------------------

/**
 * @param {object} contract
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateKalshiConfidenceGateContract(contract) {
  const errors = [];

  if (!contract || typeof contract !== "object" || Array.isArray(contract)) {
    return { valid: false, errors: ["contract must be a non-null object"] };
  }

  // 1. Required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in contract)) {
      errors.push(`missing required field: "${field}"`);
    }
  }

  // 2. No unknown fields
  for (const key of Object.keys(contract)) {
    if (!ALLOWED_FIELDS.has(key)) {
      errors.push(`unknown field: "${key}"`);
    }
  }

  // If missing critical fields, stop early to avoid cascading errors
  const hasCritical = ["schema_version", "gate_contract_mode", "source_phase", "overall_gate_status"]
    .every((f) => f in contract);
  if (!hasCritical) {
    return { valid: errors.length === 0, errors };
  }

  // 3. schema_version
  if (contract.schema_version !== SCHEMA_VERSION) {
    errors.push(
      `schema_version must be "${SCHEMA_VERSION}", got "${contract.schema_version}"`
    );
  }

  // 4. gate_contract_mode
  if (contract.gate_contract_mode !== GATE_CONTRACT_MODE) {
    errors.push(
      `gate_contract_mode must be "${GATE_CONTRACT_MODE}", got "${contract.gate_contract_mode}"`
    );
  }

  // 5. source_phase
  if (contract.source_phase !== SOURCE_PHASE) {
    errors.push(
      `source_phase must be "${SOURCE_PHASE}", got "${contract.source_phase}"`
    );
  }

  // 6. generated_at
  if (!isValidIso8601(contract.generated_at)) {
    errors.push("generated_at must be a valid ISO 8601 timestamp");
  }

  // 7. Deterministic ID
  if (contract.kalshi_confidence_gate_contract_id) {
    const expectedId = computeExpectedId({
      gateContractMode: contract.gate_contract_mode,
      sourcePhase: contract.source_phase,
      overallGateStatus: contract.overall_gate_status,
    });
    if (contract.kalshi_confidence_gate_contract_id !== expectedId) {
      errors.push(
        `kalshi_confidence_gate_contract_id is non-deterministic: expected "${expectedId}", got "${contract.kalshi_confidence_gate_contract_id}"`
      );
    }
    if (!/^kcgc_[a-f0-9]{32}$/.test(contract.kalshi_confidence_gate_contract_id)) {
      errors.push(
        `kalshi_confidence_gate_contract_id must match pattern kcgc_[a-f0-9]{32}`
      );
    }
  }

  // 8. required_source_artifacts
  if ("required_source_artifacts" in contract) {
    validateRequiredSourceArtifacts(errors, contract.required_source_artifacts);
  }

  // 9. gates
  if ("gates" in contract) {
    validateGates(errors, contract.gates);
  }

  // 10. overall_gate_status
  if (contract.overall_gate_status !== OVERALL_GATE_STATUS) {
    errors.push(
      `overall_gate_status must be "${OVERALL_GATE_STATUS}", got "${contract.overall_gate_status}"`
    );
  }

  // 11. Safety flags — all must be hardcoded
  if (contract.phase_6_ready !== false) {
    errors.push("phase_6_ready must be false");
  }
  if (contract.live_mode_allowed !== false) {
    errors.push("live_mode_allowed must be false");
  }
  if (contract.credentials_allowed !== false) {
    errors.push("credentials_allowed must be false");
  }
  if (contract.order_placement_allowed !== false) {
    errors.push("order_placement_allowed must be false");
  }
  if (contract.autonomous_execution_allowed !== false) {
    errors.push("autonomous_execution_allowed must be false");
  }
  if (contract.risk_governor_required !== true) {
    errors.push("risk_governor_required must be true");
  }
  if (contract.operator_signoff_required !== true) {
    errors.push("operator_signoff_required must be true");
  }
  if (contract.operator_signoff_complete !== false) {
    errors.push("operator_signoff_complete must be false");
  }
  if (contract.paper_only !== true) {
    errors.push("paper_only must be true");
  }

  // 12. reason_code
  if (contract.reason_code !== REASON_CODE) {
    errors.push(
      `reason_code must be "${REASON_CODE}", got "${contract.reason_code}"`
    );
  }

  // 13. reason non-empty
  if (typeof contract.reason !== "string" || contract.reason.trim().length === 0) {
    errors.push("reason must be a non-empty string");
  }

  // 14. Forbidden field names (recursive)
  validateNoForbiddenFieldNames(errors, contract);

  // 15. Forbidden string values (recursive)
  validateNoForbiddenStringValues(errors, contract);

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// File validator
// ---------------------------------------------------------------------------

/**
 * @param {string} filePath
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateKalshiConfidenceGateContractFile(filePath) {
  let contract;
  try {
    const raw = readFileSync(filePath, "utf8");
    contract = JSON.parse(raw);
  } catch (err) {
    return { valid: false, errors: [`failed to read/parse file: ${err.message}`] };
  }
  return validateKalshiConfidenceGateContract(contract);
}

// ---------------------------------------------------------------------------
// Report formatter
// ---------------------------------------------------------------------------

/**
 * @param {{ filePath: string, valid: boolean, errors: string[] }} result
 * @returns {string}
 */
export function formatKalshiConfidenceGateContractValidationReport({ filePath, valid, errors }) {
  const lines = [
    "Overlord KalshiConfidenceGateContract Validation",
    `fixture: ${filePath}`,
    `status: ${valid ? "PASS" : "FAIL"}`,
    `errors: ${errors.length}`,
  ];
  if (errors.length > 0) {
    lines.push("");
    for (const err of errors) {
      lines.push(`  - ${err}`);
    }
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// CLI entry point (only when executed directly, not when imported)
// ---------------------------------------------------------------------------

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  const FIXTURE_PATH =
    "packages/strategy-dsl/fixtures/synthetic_kalshi_confidence_gate_contract.json";

  const result = validateKalshiConfidenceGateContractFile(FIXTURE_PATH);
  const report = formatKalshiConfidenceGateContractValidationReport({
    filePath: FIXTURE_PATH,
    ...result,
  });
  console.log(report);
  process.exit(result.valid ? 0 : 1);
}
