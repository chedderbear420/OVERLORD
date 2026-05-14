/**
 * validate-kalshi-paper-readiness-gate-evidence-bundle.js
 *
 * Phase 5C — Validator for KalshiPaperReadinessGateEvidenceBundle.
 *
 * No file I/O in validate*(). File and CLI entry points are guarded.
 * No network. No credentials. No env. Paper-only. Offline-safe.
 *
 * Exports:
 *   validateKalshiPaperReadinessGateEvidenceBundle(bundle) -> { valid, errors }
 *   validateKalshiPaperReadinessGateEvidenceBundleFile(filePath) -> { valid, errors }
 *   formatKalshiPaperReadinessGateEvidenceBundleValidationReport({ filePath, valid, errors }) -> string
 */

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCHEMA_VERSION = "kalshi_paper_readiness_gate_evidence_bundle.v1";
const PHASE = "Phase 5C";
const REASON_CODE = "PAPER_READINESS_EVIDENCE_INDEXED_NOT_EVALUATED";

const EXPECTED_CGC_ID = "kcgc_787dd9801f55fa3a73598d9f781a3f06";
const EXPECTED_KRREB_ID = "krreb_2d4bb748dc0130b2d91397a06cacde74";

const EXPECTED_UPSTREAM_SCHEMA_VERSIONS = {
  confidence_gate_contract: "kalshi_confidence_gate_contract.v1",
  research_review_evidence_bundle: "kalshi_research_review_evidence_bundle.v1",
};

const APPROVED_BUNDLE_STATUSES = new Set(["blocked", "incomplete", "not_ready"]);

const REQUIRED_TOP_LEVEL_FIELDS = [
  "kalshi_paper_readiness_gate_evidence_bundle_id",
  "schema_version",
  "generated_at",
  "phase",
  "bundle_status",
  "upstream_evidence_bundle_ids",
  "upstream_bundle_count",
  "upstream_bundle_schema_versions",
  "reviewed_research_artifacts",
  "reviewed_market_ingest_artifacts",
  "reviewed_signal_definition_artifacts",
  "reviewed_paper_ledger_artifacts",
  "reviewed_replay_artifacts",
  "readiness_checks",
  "missing_evidence",
  "blocking_issues",
  "non_blocking_notes",
  "safety_flags",
  "forbidden_capabilities",
  "allowed_outputs",
  "forbidden_outputs",
  "reason_code",
  "reason",
];

const ALLOWED_TOP_LEVEL_FIELDS = new Set(REQUIRED_TOP_LEVEL_FIELDS);

const REQUIRED_READINESS_CHECK_KEYS = new Set([
  "signal_calibration_evidence_present",
  "edge_consistency_evidence_present",
  "paper_pnl_evidence_present",
  "replay_evidence_present",
  "market_ingest_evidence_present",
]);

const REQUIRED_SAFETY_FLAG_KEYS = new Set([
  "paper_only",
  "live_execution_allowed",
  "live_mode_allowed",
  "order_placement_allowed",
  "credentials_allowed",
  "credential_access_allowed",
  "autonomous_execution_allowed",
  "gate_evaluation_allowed",
  "gates_passed",
  "phase_6_ready",
  "operator_signoff_complete",
]);

const REQUIRED_UPSTREAM_BUNDLE_SCHEMA_VERSION_KEYS = new Set([
  "confidence_gate_contract",
  "research_review_evidence_bundle",
]);

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
  "fetch",
  "axios",
  "websocket",
  "polling",
  "cron",
  "account",
  "balance",
  "portfolio",
  "live_position",
  "approved_for_live",
  "ready_for_live",
]);

// Structural safety field names — exempt from forbidden-field-name scan
const FIELD_NAME_EXEMPTIONS = new Set([
  "order_placement_allowed",
  "credentials_allowed",
  "credential_access_allowed",
  "autonomous_execution_allowed",
  "operator_signoff_complete",
  "gate_evaluation_allowed",
  "gates_passed",
  "phase_6_ready",
  "live_execution_allowed",
  "live_mode_allowed",
]);

// Top-level keys exempt from string-value scan
const STRING_SCAN_EXEMPT_TOP_LEVEL_KEYS = new Set([
  "kalshi_paper_readiness_gate_evidence_bundle_id",
  "schema_version",
  "generated_at",
  "phase",
  "bundle_status",
  "reason_code",
  // Enum arrays — exempt as controlled vocabularies
  "upstream_evidence_bundle_ids",
  "upstream_bundle_count",
  "reviewed_research_artifacts",
  "reviewed_market_ingest_artifacts",
  "reviewed_signal_definition_artifacts",
  "reviewed_paper_ledger_artifacts",
  "reviewed_replay_artifacts",
  "forbidden_capabilities",
  "allowed_outputs",
  "forbidden_outputs",
  "missing_evidence",
  "blocking_issues",
  "non_blocking_notes",
]);

// upstream_bundle_schema_versions sub-fields exempt
const UPSTREAM_BUNDLE_SCHEMA_VERSIONS_EXEMPT = new Set([
  "confidence_gate_contract",
  "research_review_evidence_bundle",
]);

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
  /\bpassed gate\b/i,
  /\bgate passed\b/i,
  /\bprofitable\b/i,
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidIso8601(str) {
  if (typeof str !== "string") return false;
  const d = new Date(str);
  return !isNaN(d.getTime()) && str.includes("T");
}

function computeExpectedId({ phase, status, upstreamBundleCount }) {
  const digest = createHash("sha256")
    .update(
      [
        phase,
        SCHEMA_VERSION,
        status,
        String(upstreamBundleCount),
      ].join("|")
    )
    .digest("hex")
    .slice(0, 32);
  return `kprgeb_${digest}`;
}

// ---------------------------------------------------------------------------
// Forbidden field name scanner (recursive)
// ---------------------------------------------------------------------------

function validateNoForbiddenFieldNames(errors, obj, pathStr = "") {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;
  for (const key of Object.keys(obj)) {
    if (!FIELD_NAME_EXEMPTIONS.has(key) && FORBIDDEN_FIELD_NAMES.has(key)) {
      errors.push(`forbidden field name "${key}" found at ${pathStr || "top level"}`);
    }
    const child = obj[key];
    if (child && typeof child === "object") {
      const childPath = pathStr ? `${pathStr}.${key}` : key;
      if (Array.isArray(child)) {
        child.forEach((item, i) => {
          if (item && typeof item === "object") {
            validateNoForbiddenFieldNames(errors, item, `${childPath}[${i}]`);
          }
        });
      } else {
        validateNoForbiddenFieldNames(errors, child, childPath);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Forbidden string value scanner
// ---------------------------------------------------------------------------

function isStringExempt(topLevelKey, pathParts) {
  if (STRING_SCAN_EXEMPT_TOP_LEVEL_KEYS.has(topLevelKey)) return true;

  // upstream_bundle_schema_versions.* values are schema version strings — exempt
  if (
    topLevelKey === "upstream_bundle_schema_versions" &&
    pathParts.length >= 1 &&
    UPSTREAM_BUNDLE_SCHEMA_VERSIONS_EXEMPT.has(pathParts[0])
  )
    return true;

  // safety_flags.* — boolean values, not strings; but exempt the key path
  if (topLevelKey === "safety_flags") return true;

  return false;
}

function scanStringValues(errors, value, topLevelKey, pathParts = []) {
  if (typeof value === "string") {
    if (!isStringExempt(topLevelKey, pathParts)) {
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

function validateNoForbiddenStringValues(errors, bundle) {
  for (const [key, value] of Object.entries(bundle)) {
    scanStringValues(errors, value, key, []);
  }
}

// ---------------------------------------------------------------------------
// Main validator
// ---------------------------------------------------------------------------

/**
 * @param {object} bundle
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateKalshiPaperReadinessGateEvidenceBundle(bundle) {
  const errors = [];

  if (!bundle || typeof bundle !== "object" || Array.isArray(bundle)) {
    return { valid: false, errors: ["bundle must be a non-null object"] };
  }

  // 1. Required fields
  for (const field of REQUIRED_TOP_LEVEL_FIELDS) {
    if (!(field in bundle)) errors.push(`missing required field: "${field}"`);
  }

  // 2. No unknown top-level fields
  for (const key of Object.keys(bundle)) {
    if (!ALLOWED_TOP_LEVEL_FIELDS.has(key)) errors.push(`unknown top-level field: "${key}"`);
  }

  // Guard: stop if critical fields missing
  const hasCritical = ["schema_version", "phase", "bundle_status"].every(
    (f) => f in bundle
  );
  if (!hasCritical) return { valid: errors.length === 0, errors };

  // 3. schema_version
  if (bundle.schema_version !== SCHEMA_VERSION)
    errors.push(
      `schema_version must be "${SCHEMA_VERSION}", got "${bundle.schema_version}"`
    );

  // 4. phase
  if (bundle.phase !== PHASE)
    errors.push(`phase must be "${PHASE}", got "${bundle.phase}"`);

  // 5. generated_at
  if (!isValidIso8601(bundle.generated_at))
    errors.push("generated_at must be a valid ISO 8601 timestamp");

  // 6. bundle_status allowlist
  if (!APPROVED_BUNDLE_STATUSES.has(bundle.bundle_status))
    errors.push(
      `bundle_status must be one of [${[...APPROVED_BUNDLE_STATUSES].join(", ")}], got "${bundle.bundle_status}"`
    );

  // 7. upstream_evidence_bundle_ids — must contain exactly the Phase 5A and 5B IDs
  if (Array.isArray(bundle.upstream_evidence_bundle_ids)) {
    const ids = bundle.upstream_evidence_bundle_ids;
    if (!ids.includes(EXPECTED_CGC_ID)) {
      errors.push(
        `upstream_evidence_bundle_ids must include Phase 5A CGC ID "${EXPECTED_CGC_ID}"`
      );
    }
    if (!ids.includes(EXPECTED_KRREB_ID)) {
      errors.push(
        `upstream_evidence_bundle_ids must include Phase 5B KRREB ID "${EXPECTED_KRREB_ID}"`
      );
    }
  }

  // 8. upstream_bundle_count must equal length of upstream_evidence_bundle_ids
  if (
    Array.isArray(bundle.upstream_evidence_bundle_ids) &&
    bundle.upstream_bundle_count !== undefined
  ) {
    if (bundle.upstream_bundle_count !== bundle.upstream_evidence_bundle_ids.length) {
      errors.push(
        `upstream_bundle_count must equal upstream_evidence_bundle_ids.length (${bundle.upstream_evidence_bundle_ids.length}), got ${bundle.upstream_bundle_count}`
      );
    }
  }

  // 9. upstream_bundle_schema_versions
  if (
    bundle.upstream_bundle_schema_versions &&
    typeof bundle.upstream_bundle_schema_versions === "object" &&
    !Array.isArray(bundle.upstream_bundle_schema_versions)
  ) {
    const usv = bundle.upstream_bundle_schema_versions;
    for (const key of REQUIRED_UPSTREAM_BUNDLE_SCHEMA_VERSION_KEYS) {
      if (!(key in usv)) {
        errors.push(`upstream_bundle_schema_versions: missing key "${key}"`);
      }
    }
    for (const key of Object.keys(usv)) {
      if (!REQUIRED_UPSTREAM_BUNDLE_SCHEMA_VERSION_KEYS.has(key)) {
        errors.push(`upstream_bundle_schema_versions: unknown key "${key}"`);
      }
    }
    for (const [key, expected] of Object.entries(EXPECTED_UPSTREAM_SCHEMA_VERSIONS)) {
      if (key in usv && usv[key] !== expected) {
        errors.push(
          `upstream_bundle_schema_versions.${key} must be "${expected}", got "${usv[key]}"`
        );
      }
    }
  }

  // 10. Deterministic ID
  if (
    bundle.kalshi_paper_readiness_gate_evidence_bundle_id &&
    bundle.phase &&
    bundle.bundle_status &&
    bundle.upstream_bundle_count !== undefined
  ) {
    const expectedId = computeExpectedId({
      phase: bundle.phase,
      status: bundle.bundle_status,
      upstreamBundleCount: bundle.upstream_bundle_count,
    });
    if (bundle.kalshi_paper_readiness_gate_evidence_bundle_id !== expectedId) {
      errors.push(
        `kalshi_paper_readiness_gate_evidence_bundle_id is non-deterministic: expected "${expectedId}", got "${bundle.kalshi_paper_readiness_gate_evidence_bundle_id}"`
      );
    }
    if (
      !/^kprgeb_[a-f0-9]{32}$/.test(
        bundle.kalshi_paper_readiness_gate_evidence_bundle_id
      )
    ) {
      errors.push(
        "kalshi_paper_readiness_gate_evidence_bundle_id must match pattern kprgeb_[a-f0-9]{32}"
      );
    }
  }

  // 11. reviewed_* arrays — must be arrays
  for (const key of [
    "reviewed_research_artifacts",
    "reviewed_market_ingest_artifacts",
    "reviewed_signal_definition_artifacts",
    "reviewed_paper_ledger_artifacts",
    "reviewed_replay_artifacts",
  ]) {
    if (key in bundle && !Array.isArray(bundle[key])) {
      errors.push(`${key} must be an array`);
    }
  }

  // 12. readiness_checks — must have exactly the required keys, all booleans
  if (bundle.readiness_checks && typeof bundle.readiness_checks === "object") {
    const rc = bundle.readiness_checks;
    for (const key of REQUIRED_READINESS_CHECK_KEYS) {
      if (!(key in rc)) {
        errors.push(`readiness_checks: missing key "${key}"`);
      } else if (typeof rc[key] !== "boolean") {
        errors.push(`readiness_checks.${key} must be a boolean`);
      }
    }
    for (const key of Object.keys(rc)) {
      if (!REQUIRED_READINESS_CHECK_KEYS.has(key)) {
        errors.push(`readiness_checks: unknown key "${key}"`);
      }
    }
    // edge_consistency and replay must be false (not yet evidence-based)
    if (rc.edge_consistency_evidence_present === true) {
      errors.push(
        "readiness_checks.edge_consistency_evidence_present must be false (no multi-market evidence yet)"
      );
    }
    if (rc.replay_evidence_present === true) {
      errors.push(
        "readiness_checks.replay_evidence_present must be false (no replay evidence yet)"
      );
    }
  }

  // 13. missing_evidence, blocking_issues, non_blocking_notes — must be non-empty arrays
  for (const key of ["missing_evidence", "blocking_issues", "non_blocking_notes"]) {
    if (key in bundle) {
      if (!Array.isArray(bundle[key])) {
        errors.push(`${key} must be an array`);
      } else if (bundle[key].length === 0) {
        errors.push(`${key} must be non-empty`);
      }
    }
  }

  // 14. safety_flags — nested object, all required, exact values
  if (bundle.safety_flags && typeof bundle.safety_flags === "object") {
    const sf = bundle.safety_flags;

    for (const key of REQUIRED_SAFETY_FLAG_KEYS) {
      if (!(key in sf)) {
        errors.push(`safety_flags: missing key "${key}"`);
      }
    }
    for (const key of Object.keys(sf)) {
      if (!REQUIRED_SAFETY_FLAG_KEYS.has(key)) {
        errors.push(`safety_flags: unknown key "${key}"`);
      }
    }

    // paper_only must be true
    if (sf.paper_only !== true) errors.push("safety_flags.paper_only must be true");

    // All other safety flags must be false
    const mustBeFalse = [
      "live_execution_allowed",
      "live_mode_allowed",
      "order_placement_allowed",
      "credentials_allowed",
      "credential_access_allowed",
      "autonomous_execution_allowed",
      "gate_evaluation_allowed",
      "gates_passed",
      "phase_6_ready",
      "operator_signoff_complete",
    ];
    for (const key of mustBeFalse) {
      if (sf[key] !== false) {
        errors.push(`safety_flags.${key} must be false`);
      }
    }
  }

  // 15. forbidden_capabilities, allowed_outputs, forbidden_outputs — must be non-empty arrays
  for (const key of ["forbidden_capabilities", "allowed_outputs", "forbidden_outputs"]) {
    if (key in bundle) {
      if (!Array.isArray(bundle[key])) {
        errors.push(`${key} must be an array`);
      } else if (bundle[key].length === 0) {
        errors.push(`${key} must be non-empty`);
      }
    }
  }

  // 16. reason_code
  if (bundle.reason_code !== REASON_CODE)
    errors.push(
      `reason_code must be "${REASON_CODE}", got "${bundle.reason_code}"`
    );

  // 17. reason non-empty string
  if (typeof bundle.reason !== "string" || bundle.reason.trim().length === 0)
    errors.push("reason must be a non-empty string");

  // 18. Forbidden field names (recursive)
  validateNoForbiddenFieldNames(errors, bundle);

  // 19. Forbidden string values (recursive)
  validateNoForbiddenStringValues(errors, bundle);

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// File validator
// ---------------------------------------------------------------------------

/**
 * @param {string} filePath
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateKalshiPaperReadinessGateEvidenceBundleFile(filePath) {
  let bundle;
  try {
    const raw = readFileSync(filePath, "utf8");
    bundle = JSON.parse(raw);
  } catch (err) {
    return { valid: false, errors: [`failed to read/parse file: ${err.message}`] };
  }
  return validateKalshiPaperReadinessGateEvidenceBundle(bundle);
}

// ---------------------------------------------------------------------------
// Report formatter
// ---------------------------------------------------------------------------

/**
 * @param {{ filePath: string, valid: boolean, errors: string[] }} result
 * @returns {string}
 */
export function formatKalshiPaperReadinessGateEvidenceBundleValidationReport({
  filePath,
  valid,
  errors,
}) {
  const lines = [
    "Overlord KalshiPaperReadinessGateEvidenceBundle Validation",
    `fixture: ${filePath}`,
    `status: ${valid ? "PASS" : "FAIL"}`,
    `errors: ${errors.length}`,
  ];
  if (errors.length > 0) {
    lines.push("");
    for (const err of errors) lines.push(`  - ${err}`);
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// CLI entry point (only when executed directly)
// ---------------------------------------------------------------------------

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  const FIXTURE_PATH =
    "packages/strategy-dsl/fixtures/synthetic_kalshi_paper_readiness_gate_evidence_bundle.json";
  const result = validateKalshiPaperReadinessGateEvidenceBundleFile(FIXTURE_PATH);
  const report = formatKalshiPaperReadinessGateEvidenceBundleValidationReport({
    filePath: FIXTURE_PATH,
    ...result,
  });
  console.log(report);
  process.exit(result.valid ? 0 : 1);
}
