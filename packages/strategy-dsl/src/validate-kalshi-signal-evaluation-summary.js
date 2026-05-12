import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { validateNoUnknownFields } from "./strategy-observation-boundary-guard.js";
import { kalshiSignalEvaluationSummaryId } from "./kalshi-signal-evaluation-summary-id.js";
import {
  APPROVED_CONDITION_FAMILIES,
  APPROVED_DATA_SOURCE_FIELDS,
  APPROVED_THRESHOLD_STATUSES,
} from "./build-kalshi-signal-evaluation-summary.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(
  repoRoot,
  "packages",
  "strategy-dsl",
  "fixtures",
  "synthetic_kalshi_signal_evaluation_summary.json"
);

const requiredFields = [
  "kalshi_signal_evaluation_summary_id",
  "schema_version",
  "generated_at",
  "evaluation_mode",
  "source_phase",
  "signal_definition_id",
  "signal_definition_schema_version",
  "market_snapshot_id",
  "market_snapshot_schema_version",
  "condition_family",
  "input_artifact_refs",
  "evaluated_thresholds",
  "evaluation_status",
  "data_quality_status",
  "research_summary",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "credentials_used",
  "network_request_used",
  "emits_signal_events",
  "emits_recommendations",
  "emits_decisions",
  "emits_orders",
  "emits_paper_ledger_entries",
  "reason_code",
  "reason",
];

// Field names that must never appear at any depth.
// NOTE: "signal_definition_id", "signal_definition_schema_version", and
// "emits_signal_events" are structural field names and are NOT in this set.
const forbiddenImplementationFields = new Set([
  "signal", "signal_event",
  "pick", "recommendation", "decision",
  "order", "trade", "execution",
  "bankroll", "position_size", "expected_value", "edge", "pnl", "profit",
  "buy", "sell", "bet", "wager", "stake", "kelly",
  "api_key", "token", "secret", "credential", "credentials",
  "fetch", "axios", "websocket", "polling", "cron",
]);

// Top-level keys exempt from free-text string scanning (structural / ID / const fields).
const exemptFromStringValueScan = new Set([
  "kalshi_signal_evaluation_summary_id",
  "schema_version",
  "generated_at",
  "evaluation_mode",
  "source_phase",
  "signal_definition_id",
  "signal_definition_schema_version",
  "market_snapshot_id",
  "market_snapshot_schema_version",
  "condition_family",
  "input_artifact_refs",       // object — validated structurally
  "evaluated_thresholds",      // array — validated structurally
  "evaluation_status",
  "data_quality_status",
  "research_summary",          // object — validated structurally
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

export async function validateKalshiSignalEvaluationSummaryFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let summary;
  try {
    summary = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, validateKalshiSignalEvaluationSummary(summary).errors);
}

export function validateKalshiSignalEvaluationSummary(summary) {
  const errors = [];

  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    return { ok: false, errors: ["KalshiSignalEvaluationSummary must be a JSON object"] };
  }

  // Field whitelist
  const unknownErrors = [];
  validateNoUnknownFields(unknownErrors, summary, requiredFields, "KalshiSignalEvaluationSummary");
  for (const e of unknownErrors) errors.push(`${e.reason_code}: ${e.message}`);

  for (const field of requiredFields) {
    if (!Object.hasOwn(summary, field)) errors.push(`${field} is required`);
  }

  validateCoreFields(errors, summary);
  validateSafetyFlags(errors, summary);
  validateDeterministicId(errors, summary);
  validateInputArtifactRefs(errors, summary);
  validateEvaluatedThresholds(errors, summary);
  validateResearchSummary(errors, summary);
  validateForbiddenImplementationFields(errors, summary);
  validateForbiddenStringValues(errors, summary);

  return { ok: errors.length === 0, errors };
}

export function formatKalshiSignalEvaluationSummaryValidationReport(report) {
  const lines = [
    "Overlord KalshiSignalEvaluationSummary Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`,
  ];
  for (const error of report.errors) lines.push(`ERROR ${error}`);
  return lines.join("\n");
}

// ─── Validation helpers ───────────────────────────────────────────────────────

function validateCoreFields(errors, summary) {
  if (summary.schema_version !== "kalshi_signal_evaluation_summary.v1") {
    errors.push("schema_version must be kalshi_signal_evaluation_summary.v1");
  }
  if (!summary.generated_at || Number.isNaN(Date.parse(summary.generated_at))) {
    errors.push("generated_at must be a valid ISO 8601 timestamp");
  }
  if (summary.evaluation_mode !== "local_fixture_evaluation_only") {
    errors.push("evaluation_mode must be local_fixture_evaluation_only");
  }
  if (summary.source_phase !== "Phase 4O") {
    errors.push("source_phase must be Phase 4O");
  }
  if (typeof summary.signal_definition_id !== "string" || !/^kssd_[a-f0-9]{32}$/.test(summary.signal_definition_id)) {
    errors.push("signal_definition_id must be a kssd_-prefixed 32-hex-char ID");
  }
  if (summary.signal_definition_schema_version !== "kalshi_strategy_signal_definition.v1") {
    errors.push("signal_definition_schema_version must be kalshi_strategy_signal_definition.v1");
  }
  if (typeof summary.market_snapshot_id !== "string" || !/^kms_[a-f0-9]{32}$/.test(summary.market_snapshot_id)) {
    errors.push("market_snapshot_id must be a kms_-prefixed 32-hex-char ID");
  }
  if (summary.market_snapshot_schema_version !== "kalshi_market_snapshot.v1") {
    errors.push("market_snapshot_schema_version must be kalshi_market_snapshot.v1");
  }
  if (!APPROVED_CONDITION_FAMILIES.has(summary.condition_family)) {
    errors.push(`condition_family must be one of: ${[...APPROVED_CONDITION_FAMILIES].join(", ")}`);
  }
  if (summary.evaluation_status !== "evaluated_non_actionable") {
    errors.push("evaluation_status must be evaluated_non_actionable");
  }
  if (summary.data_quality_status !== "complete") {
    errors.push("data_quality_status must be complete");
  }
  if (summary.reason_code !== "EVALUATION_COMPLETE_NON_ACTIONABLE") {
    errors.push("reason_code must be EVALUATION_COMPLETE_NON_ACTIONABLE");
  }
  if (typeof summary.reason !== "string" || summary.reason.length === 0) {
    errors.push("reason must be a non-empty string");
  }
}

function validateSafetyFlags(errors, summary) {
  if (summary.paper_only !== true) errors.push("paper_only must be true");
  if (summary.live_execution_allowed !== false) errors.push("live_execution_allowed must be false");
  if (summary.order_placement_allowed !== false) errors.push("order_placement_allowed must be false");
  if (summary.credentials_used !== false) errors.push("credentials_used must be false");
  if (summary.network_request_used !== false) errors.push("network_request_used must be false");
  if (summary.emits_signal_events !== false) {
    errors.push("emits_signal_events must be false — Phase 4O does not emit signal events");
  }
  if (summary.emits_recommendations !== false) {
    errors.push("emits_recommendations must be false — Phase 4O does not emit recommendations");
  }
  if (summary.emits_decisions !== false) {
    errors.push("emits_decisions must be false — Phase 4O does not emit decisions");
  }
  if (summary.emits_orders !== false) {
    errors.push("emits_orders must be false — Phase 4O does not emit orders");
  }
  if (summary.emits_paper_ledger_entries !== false) {
    errors.push("emits_paper_ledger_entries must be false — Phase 4O does not emit paper ledger entries");
  }
}

function validateDeterministicId(errors, summary) {
  if (
    typeof summary.signal_definition_id !== "string" ||
    typeof summary.market_snapshot_id !== "string" ||
    typeof summary.evaluation_mode !== "string" ||
    typeof summary.condition_family !== "string"
  ) return;

  const expected = kalshiSignalEvaluationSummaryId({
    signalDefinitionId: summary.signal_definition_id,
    marketSnapshotId: summary.market_snapshot_id,
    evaluationMode: summary.evaluation_mode,
    schemaVersion: "kalshi_signal_evaluation_summary.v1",
    conditionFamily: summary.condition_family,
  });
  if (summary.kalshi_signal_evaluation_summary_id !== expected) {
    errors.push(
      "kalshi_signal_evaluation_summary_id must be deterministic from signal_definition_id, market_snapshot_id, evaluation_mode, schema_version, condition_family"
    );
  }
}

function validateInputArtifactRefs(errors, summary) {
  const refs = summary.input_artifact_refs;
  if (!refs || typeof refs !== "object" || Array.isArray(refs)) {
    errors.push("input_artifact_refs must be an object");
    return;
  }

  // signal_definition ref
  const sigRef = refs.signal_definition;
  if (!sigRef || typeof sigRef !== "object" || Array.isArray(sigRef)) {
    errors.push("input_artifact_refs.signal_definition must be an object");
  } else {
    if (sigRef.artifact_id !== summary.signal_definition_id) {
      errors.push(
        "input_artifact_refs.signal_definition.artifact_id must match signal_definition_id"
      );
    }
    if (sigRef.schema_version !== "kalshi_strategy_signal_definition.v1") {
      errors.push(
        "input_artifact_refs.signal_definition.schema_version must be kalshi_strategy_signal_definition.v1"
      );
    }
  }

  // market_snapshot ref
  const snapRef = refs.market_snapshot;
  if (!snapRef || typeof snapRef !== "object" || Array.isArray(snapRef)) {
    errors.push("input_artifact_refs.market_snapshot must be an object");
  } else {
    if (snapRef.artifact_id !== summary.market_snapshot_id) {
      errors.push(
        "input_artifact_refs.market_snapshot.artifact_id must match market_snapshot_id"
      );
    }
    if (snapRef.schema_version !== "kalshi_market_snapshot.v1") {
      errors.push(
        "input_artifact_refs.market_snapshot.schema_version must be kalshi_market_snapshot.v1"
      );
    }
  }
}

function validateEvaluatedThresholds(errors, summary) {
  if (!Array.isArray(summary.evaluated_thresholds)) {
    errors.push("evaluated_thresholds must be an array");
    return;
  }
  if (summary.evaluated_thresholds.length === 0) {
    errors.push("evaluated_thresholds must have at least one entry");
    return;
  }
  const thresholdItemFields = [
    "threshold_name",
    "threshold_value",
    "comparison",
    "data_source_field",
    "observed_value",
    "required_for_evaluation",
    "status",
    "passed",
  ];
  for (let i = 0; i < summary.evaluated_thresholds.length; i++) {
    const t = summary.evaluated_thresholds[i];
    if (!t || typeof t !== "object" || Array.isArray(t)) {
      errors.push(`evaluated_thresholds[${i}] must be an object`);
      continue;
    }
    for (const field of thresholdItemFields) {
      if (!Object.hasOwn(t, field)) {
        errors.push(`evaluated_thresholds[${i}].${field} is required`);
      }
    }
    if (typeof t.threshold_name !== "string" || t.threshold_name.length === 0) {
      errors.push(`evaluated_thresholds[${i}].threshold_name must be a non-empty string`);
    }
    if (typeof t.threshold_value !== "number") {
      errors.push(`evaluated_thresholds[${i}].threshold_value must be a number`);
    }
    if (t.comparison !== "lte" && t.comparison !== "gte") {
      errors.push(`evaluated_thresholds[${i}].comparison must be "lte" or "gte"`);
    }
    if (!APPROVED_DATA_SOURCE_FIELDS.has(t.data_source_field)) {
      errors.push(
        `evaluated_thresholds[${i}].data_source_field "${t.data_source_field}" is not an approved data_source_field`
      );
    }
    if (typeof t.observed_value !== "number") {
      errors.push(`evaluated_thresholds[${i}].observed_value must be a number`);
    }
    if (typeof t.required_for_evaluation !== "boolean") {
      errors.push(`evaluated_thresholds[${i}].required_for_evaluation must be a boolean`);
    }
    if (!APPROVED_THRESHOLD_STATUSES.has(t.status)) {
      errors.push(
        `evaluated_thresholds[${i}].status must be "evaluated" (got "${t.status}")`
      );
    }
    if (typeof t.passed !== "boolean") {
      errors.push(`evaluated_thresholds[${i}].passed must be a boolean`);
    }
  }
}

function validateResearchSummary(errors, summary) {
  const rs = summary.research_summary;
  if (!rs || typeof rs !== "object" || Array.isArray(rs)) {
    errors.push("research_summary must be an object");
    return;
  }
  const required = [
    "thresholds_evaluated_count",
    "thresholds_passed_count",
    "thresholds_failed_count",
    "evaluation_complete",
  ];
  for (const field of required) {
    if (!Object.hasOwn(rs, field)) errors.push(`research_summary.${field} is required`);
  }

  if (!Array.isArray(summary.evaluated_thresholds)) return;

  const actualCount = summary.evaluated_thresholds.length;
  const actualPassed = summary.evaluated_thresholds.filter((t) => t.passed === true).length;
  const actualFailed = summary.evaluated_thresholds.filter((t) => t.passed === false).length;
  const actualComplete = actualFailed === 0;

  if (rs.thresholds_evaluated_count !== actualCount) {
    errors.push(
      `research_summary.thresholds_evaluated_count must match evaluated_thresholds.length (expected ${actualCount}, got ${rs.thresholds_evaluated_count})`
    );
  }
  if (rs.thresholds_passed_count !== actualPassed) {
    errors.push(
      `research_summary.thresholds_passed_count does not match passed thresholds (expected ${actualPassed}, got ${rs.thresholds_passed_count})`
    );
  }
  if (rs.thresholds_failed_count !== actualFailed) {
    errors.push(
      `research_summary.thresholds_failed_count does not match failed thresholds (expected ${actualFailed}, got ${rs.thresholds_failed_count})`
    );
  }
  if (rs.evaluation_complete !== actualComplete) {
    errors.push(
      `research_summary.evaluation_complete must be ${actualComplete} when thresholds_failed_count is ${actualFailed}`
    );
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
      errors.push(`forbidden evaluation summary field detected: ${fieldPath}`);
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
          `forbidden evaluation summary string value at ${fieldPath}: contains "${label}"`
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
  const report = await validateKalshiSignalEvaluationSummaryFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath,
  });
  console.log(formatKalshiSignalEvaluationSummaryValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
