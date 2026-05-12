/**
 * validate-kalshi-research-review-evidence-bundle.js
 *
 * Phase 5B — Validator for KalshiResearchReviewEvidenceBundle.
 *
 * No file I/O in validate*(). File and CLI entry points are guarded.
 * No network. No credentials. No env. Paper-only. Offline-safe.
 *
 * Exports:
 *   validateKalshiResearchReviewEvidenceBundle(bundle) -> { valid, errors }
 *   validateKalshiResearchReviewEvidenceBundleFile(filePath) -> { valid, errors }
 *   formatKalshiResearchReviewEvidenceBundleValidationReport({ filePath, valid, errors }) -> string
 */

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCHEMA_VERSION = "kalshi_research_review_evidence_bundle.v1";
const EVIDENCE_BUNDLE_MODE = "phase_5b_evidence_bundle_only";
const SOURCE_PHASE = "Phase 5B";
const CGC_SCHEMA_VERSION = "kalshi_confidence_gate_contract.v1";
const REASON_CODE = "EVIDENCE_BUNDLE_INDEXED_NOT_EVALUATED";
const EXPECTED_CGC_ID = "kcgc_787dd9801f55fa3a73598d9f781a3f06";

const REQUIRED_FIELDS = [
  "kalshi_research_review_evidence_bundle_id",
  "schema_version",
  "generated_at",
  "evidence_bundle_mode",
  "source_phase",
  "confidence_gate_contract_id",
  "confidence_gate_contract_schema_version",
  "input_artifact_refs",
  "evidence_items",
  "gate_evidence_map",
  "bundle_status",
  "review_status",
  "gate_evaluation_allowed",
  "gates_passed",
  "phase_6_ready",
  "live_mode_allowed",
  "credentials_allowed",
  "order_placement_allowed",
  "autonomous_execution_allowed",
  "operator_signoff_complete",
  "paper_only",
  "reason_code",
  "reason",
];

const ALLOWED_FIELDS = new Set(REQUIRED_FIELDS);

const REQUIRED_ARTIFACT_REF_KEYS = new Set([
  "confidence_gate_contract",
  "market_snapshot",
  "strategy_signal_definition",
  "signal_evaluation_summary",
  "paper_ledger_entry",
]);

const ARTIFACT_REF_SCHEMA_VERSIONS = {
  confidence_gate_contract: "kalshi_confidence_gate_contract.v1",
  market_snapshot: "kalshi_market_snapshot.v1",
  strategy_signal_definition: "kalshi_strategy_signal_definition.v1",
  signal_evaluation_summary: "kalshi_signal_evaluation_summary.v1",
  paper_ledger_entry: "kalshi_paper_ledger_entry.v1",
};

const APPROVED_EVIDENCE_TYPES = new Set([
  "market_snapshot_fixture",
  "strategy_signal_definition_fixture",
  "signal_evaluation_summary_fixture",
  "paper_ledger_entry_fixture",
  "confidence_gate_contract_fixture",
]);

const APPROVED_EVIDENCE_STATUSES = new Set([
  "indexed",
  "available_for_future_review",
  "not_evaluated",
]);

const FORBIDDEN_EVIDENCE_STATUSES = new Set([
  "passed",
  "approved",
  "ready",
  "live_ready",
  "validated_for_live",
]);

const REQUIRED_GATE_IDS = new Set([
  "signal_calibration",
  "edge_consistency",
  "paper_pnl",
  "risk_governor",
  "operator_signoff",
]);

const APPROVED_GATE_MAP_STATUSES = new Set([
  "mapped_not_evaluated",
  "missing_future_evidence",
]);

const FORBIDDEN_GATE_MAP_STATUSES = new Set([
  "passed",
  "complete",
  "approved",
  "ready",
  "live_ready",
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
  "approved_for_live",
  "ready_for_live",
]);

// Structural safety field names — exempt from forbidden-field-name scan
const FIELD_NAME_EXEMPTIONS = new Set([
  "order_placement_allowed",
  "credentials_allowed",
  "autonomous_execution_allowed",
  "operator_signoff_complete",
  "gate_evaluation_allowed",
  "gates_passed",
  "phase_6_ready",
]);

// Top-level keys exempt from string-value scan
const STRING_SCAN_EXEMPT_TOP_LEVEL_KEYS = new Set([
  "kalshi_research_review_evidence_bundle_id",
  "schema_version",
  "generated_at",
  "evidence_bundle_mode",
  "source_phase",
  "confidence_gate_contract_id",
  "confidence_gate_contract_schema_version",
  "bundle_status",
  "review_status",
  "reason_code",
]);

// evidence_items sub-fields exempt from string-value scan
const EVIDENCE_ITEM_EXEMPT_FIELDS = new Set([
  "evidence_id",
  "evidence_type",
  "source_artifact_key",
  "source_artifact_id",
  "source_schema_version",
  "supports_gate_ids",
  "evidence_status",
  "review_scope",
]);

// input_artifact_refs sub-fields exempt
const ARTIFACT_REF_EXEMPT_FIELDS = new Set([
  "artifact_id",
  "schema_version",
  "required",
]);

// gate_evidence_map sub-fields exempt
const GATE_MAP_EXEMPT_FIELDS = new Set([
  "mapped_evidence_ids",
  "evidence_status",
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

function computeExpectedId({ evidenceBundleMode, sourcePhase, confidenceGateContractId, evidenceItemCount }) {
  const digest = createHash("sha256")
    .update(
      [
        evidenceBundleMode,
        SCHEMA_VERSION,
        sourcePhase,
        confidenceGateContractId,
        String(evidenceItemCount),
      ].join("|")
    )
    .digest("hex")
    .slice(0, 32);
  return `krreb_${digest}`;
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

  // input_artifact_refs.*.artifact_id / schema_version / required
  if (topLevelKey === "input_artifact_refs" && pathParts.length >= 2 &&
    ARTIFACT_REF_EXEMPT_FIELDS.has(pathParts[pathParts.length - 1])) return true;

  // evidence_items.*.evidence_id / evidence_type / source_artifact_key / source_artifact_id / etc.
  if (topLevelKey === "evidence_items" && pathParts.length >= 2 &&
    EVIDENCE_ITEM_EXEMPT_FIELDS.has(pathParts[pathParts.length - 1])) return true;

  // gate_evidence_map.*.mapped_evidence_ids / evidence_status
  if (topLevelKey === "gate_evidence_map" && pathParts.length >= 2 &&
    GATE_MAP_EXEMPT_FIELDS.has(pathParts[pathParts.length - 1])) return true;

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
// Input artifact refs validator
// ---------------------------------------------------------------------------

function validateInputArtifactRefs(errors, refs) {
  if (!refs || typeof refs !== "object" || Array.isArray(refs)) {
    errors.push("input_artifact_refs must be an object");
    return {};
  }
  for (const key of REQUIRED_ARTIFACT_REF_KEYS) {
    if (!(key in refs)) {
      errors.push(`input_artifact_refs: missing "${key}"`);
    }
  }
  for (const key of Object.keys(refs)) {
    if (!REQUIRED_ARTIFACT_REF_KEYS.has(key)) {
      errors.push(`input_artifact_refs: unknown key "${key}"`);
    }
  }
  for (const [key, ref] of Object.entries(refs)) {
    if (!REQUIRED_ARTIFACT_REF_KEYS.has(key)) continue;
    if (!ref || typeof ref !== "object") {
      errors.push(`input_artifact_refs.${key}: must be an object`);
      continue;
    }
    const expectedVersion = ARTIFACT_REF_SCHEMA_VERSIONS[key];
    if (ref.schema_version !== expectedVersion) {
      errors.push(
        `input_artifact_refs.${key}.schema_version must be "${expectedVersion}", got "${ref.schema_version}"`
      );
    }
    if (ref.required !== true) {
      errors.push(`input_artifact_refs.${key}.required must be true`);
    }
    if (!ref.artifact_id || typeof ref.artifact_id !== "string") {
      errors.push(`input_artifact_refs.${key}.artifact_id must be a non-empty string`);
    }
  }
  return refs;
}

// ---------------------------------------------------------------------------
// Evidence items validator
// ---------------------------------------------------------------------------

function validateEvidenceItems(errors, items, refs) {
  if (!Array.isArray(items) || items.length === 0) {
    errors.push("evidence_items must be a non-empty array");
    return new Set();
  }

  const seenIds = new Set();
  const validIds = new Set();

  for (const item of items) {
    const eid = item.evidence_id;

    // Unique ID
    if (seenIds.has(eid)) {
      errors.push(`duplicate evidence_id: "${eid}"`);
    } else {
      seenIds.add(eid);
      validIds.add(eid);
    }

    // evidence_type allowlist
    if (!APPROVED_EVIDENCE_TYPES.has(item.evidence_type)) {
      errors.push(`evidence item "${eid}": unknown evidence_type "${item.evidence_type}"`);
    }

    // evidence_status allowlist / forbidden check
    if (FORBIDDEN_EVIDENCE_STATUSES.has(item.evidence_status)) {
      errors.push(`evidence item "${eid}": evidence_status "${item.evidence_status}" is forbidden`);
    } else if (!APPROVED_EVIDENCE_STATUSES.has(item.evidence_status)) {
      errors.push(`evidence item "${eid}": unknown evidence_status "${item.evidence_status}"`);
    }

    // source_artifact_key must be known
    if (!REQUIRED_ARTIFACT_REF_KEYS.has(item.source_artifact_key)) {
      errors.push(`evidence item "${eid}": unknown source_artifact_key "${item.source_artifact_key}"`);
    } else if (refs) {
      const ref = refs[item.source_artifact_key];
      if (ref) {
        // source_artifact_id must match ref
        if (item.source_artifact_id !== ref.artifact_id) {
          errors.push(
            `evidence item "${eid}": source_artifact_id "${item.source_artifact_id}" does not match input_artifact_refs.${item.source_artifact_key}.artifact_id "${ref.artifact_id}"`
          );
        }
        // source_schema_version must match ref
        if (item.source_schema_version !== ref.schema_version) {
          errors.push(
            `evidence item "${eid}": source_schema_version "${item.source_schema_version}" does not match input_artifact_refs.${item.source_artifact_key}.schema_version "${ref.schema_version}"`
          );
        }
      }
    }

    // supports_gate_ids must use approved gate IDs
    if (Array.isArray(item.supports_gate_ids)) {
      for (const gid of item.supports_gate_ids) {
        if (!REQUIRED_GATE_IDS.has(gid)) {
          errors.push(`evidence item "${eid}": supports_gate_ids contains unknown gate "${gid}"`);
        }
      }
    }
  }

  return validIds;
}

// ---------------------------------------------------------------------------
// Gate evidence map validator
// ---------------------------------------------------------------------------

function validateGateEvidenceMap(errors, map, validEvidenceIds) {
  if (!map || typeof map !== "object" || Array.isArray(map)) {
    errors.push("gate_evidence_map must be an object");
    return;
  }

  for (const gid of REQUIRED_GATE_IDS) {
    if (!(gid in map)) {
      errors.push(`gate_evidence_map: missing required gate "${gid}"`);
    }
  }

  for (const gid of Object.keys(map)) {
    if (!REQUIRED_GATE_IDS.has(gid)) {
      errors.push(`gate_evidence_map: unknown gate "${gid}"`);
      continue;
    }
    const entry = map[gid];

    // evidence_status
    if (FORBIDDEN_GATE_MAP_STATUSES.has(entry.evidence_status)) {
      errors.push(
        `gate_evidence_map.${gid}.evidence_status "${entry.evidence_status}" is forbidden`
      );
    } else if (!APPROVED_GATE_MAP_STATUSES.has(entry.evidence_status)) {
      errors.push(
        `gate_evidence_map.${gid}.evidence_status "${entry.evidence_status}" is not approved`
      );
    }

    // risk_governor and operator_signoff must be missing_future_evidence with empty IDs
    if (gid === "risk_governor" || gid === "operator_signoff") {
      if (entry.evidence_status !== "missing_future_evidence") {
        errors.push(
          `gate_evidence_map.${gid}.evidence_status must be "missing_future_evidence", got "${entry.evidence_status}"`
        );
      }
      if (!Array.isArray(entry.mapped_evidence_ids) || entry.mapped_evidence_ids.length > 0) {
        errors.push(`gate_evidence_map.${gid}.mapped_evidence_ids must be an empty array`);
      }
    }

    // mapped IDs must exist in evidence_items
    if (Array.isArray(entry.mapped_evidence_ids)) {
      for (const mid of entry.mapped_evidence_ids) {
        if (!validEvidenceIds.has(mid)) {
          errors.push(
            `gate_evidence_map.${gid}: mapped_evidence_id "${mid}" does not exist in evidence_items`
          );
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main validator
// ---------------------------------------------------------------------------

/**
 * @param {object} bundle
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateKalshiResearchReviewEvidenceBundle(bundle) {
  const errors = [];

  if (!bundle || typeof bundle !== "object" || Array.isArray(bundle)) {
    return { valid: false, errors: ["bundle must be a non-null object"] };
  }

  // 1. Required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in bundle)) errors.push(`missing required field: "${field}"`);
  }

  // 2. No unknown fields
  for (const key of Object.keys(bundle)) {
    if (!ALLOWED_FIELDS.has(key)) errors.push(`unknown field: "${key}"`);
  }

  // Guard: stop if critical fields missing
  const hasCritical = ["schema_version", "evidence_bundle_mode", "source_phase",
    "confidence_gate_contract_id", "confidence_gate_contract_schema_version"].every((f) => f in bundle);
  if (!hasCritical) return { valid: errors.length === 0, errors };

  // 3. schema_version
  if (bundle.schema_version !== SCHEMA_VERSION)
    errors.push(`schema_version must be "${SCHEMA_VERSION}", got "${bundle.schema_version}"`);

  // 4. evidence_bundle_mode
  if (bundle.evidence_bundle_mode !== EVIDENCE_BUNDLE_MODE)
    errors.push(`evidence_bundle_mode must be "${EVIDENCE_BUNDLE_MODE}", got "${bundle.evidence_bundle_mode}"`);

  // 5. source_phase
  if (bundle.source_phase !== SOURCE_PHASE)
    errors.push(`source_phase must be "${SOURCE_PHASE}", got "${bundle.source_phase}"`);

  // 6. generated_at
  if (!isValidIso8601(bundle.generated_at))
    errors.push("generated_at must be a valid ISO 8601 timestamp");

  // 7. confidence_gate_contract_schema_version
  if (bundle.confidence_gate_contract_schema_version !== CGC_SCHEMA_VERSION)
    errors.push(`confidence_gate_contract_schema_version must be "${CGC_SCHEMA_VERSION}"`);

  // 8. confidence_gate_contract_id — validate against known 5A fixture
  if (bundle.confidence_gate_contract_id && bundle.confidence_gate_contract_id !== EXPECTED_CGC_ID) {
    errors.push(
      `confidence_gate_contract_id "${bundle.confidence_gate_contract_id}" does not match expected 5A fixture ID "${EXPECTED_CGC_ID}"`
    );
  }

  // 9. Deterministic ID
  if (bundle.kalshi_research_review_evidence_bundle_id && Array.isArray(bundle.evidence_items)) {
    const expectedId = computeExpectedId({
      evidenceBundleMode: bundle.evidence_bundle_mode,
      sourcePhase: bundle.source_phase,
      confidenceGateContractId: bundle.confidence_gate_contract_id,
      evidenceItemCount: bundle.evidence_items.length,
    });
    if (bundle.kalshi_research_review_evidence_bundle_id !== expectedId) {
      errors.push(
        `kalshi_research_review_evidence_bundle_id is non-deterministic: expected "${expectedId}", got "${bundle.kalshi_research_review_evidence_bundle_id}"`
      );
    }
    if (!/^krreb_[a-f0-9]{32}$/.test(bundle.kalshi_research_review_evidence_bundle_id)) {
      errors.push("kalshi_research_review_evidence_bundle_id must match pattern krreb_[a-f0-9]{32}");
    }
  }

  // 10. input_artifact_refs
  const refs = "input_artifact_refs" in bundle
    ? (validateInputArtifactRefs(errors, bundle.input_artifact_refs), bundle.input_artifact_refs)
    : null;

  // 11. evidence_items
  const validEvidenceIds = "evidence_items" in bundle
    ? validateEvidenceItems(errors, bundle.evidence_items, refs)
    : new Set();

  // 12. gate_evidence_map
  if ("gate_evidence_map" in bundle)
    validateGateEvidenceMap(errors, bundle.gate_evidence_map, validEvidenceIds);

  // 13. bundle_status
  if (bundle.bundle_status !== "evidence_indexed_not_evaluated")
    errors.push(`bundle_status must be "evidence_indexed_not_evaluated", got "${bundle.bundle_status}"`);

  // 14. review_status
  if (bundle.review_status !== "pending_gate_evaluation")
    errors.push(`review_status must be "pending_gate_evaluation", got "${bundle.review_status}"`);

  // 15. Safety flags
  if (bundle.gate_evaluation_allowed !== false) errors.push("gate_evaluation_allowed must be false");
  if (bundle.gates_passed !== false) errors.push("gates_passed must be false");
  if (bundle.phase_6_ready !== false) errors.push("phase_6_ready must be false");
  if (bundle.live_mode_allowed !== false) errors.push("live_mode_allowed must be false");
  if (bundle.credentials_allowed !== false) errors.push("credentials_allowed must be false");
  if (bundle.order_placement_allowed !== false) errors.push("order_placement_allowed must be false");
  if (bundle.autonomous_execution_allowed !== false) errors.push("autonomous_execution_allowed must be false");
  if (bundle.operator_signoff_complete !== false) errors.push("operator_signoff_complete must be false");
  if (bundle.paper_only !== true) errors.push("paper_only must be true");

  // 16. reason_code
  if (bundle.reason_code !== REASON_CODE)
    errors.push(`reason_code must be "${REASON_CODE}", got "${bundle.reason_code}"`);

  // 17. reason non-empty
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
export function validateKalshiResearchReviewEvidenceBundleFile(filePath) {
  let bundle;
  try {
    const raw = readFileSync(filePath, "utf8");
    bundle = JSON.parse(raw);
  } catch (err) {
    return { valid: false, errors: [`failed to read/parse file: ${err.message}`] };
  }
  return validateKalshiResearchReviewEvidenceBundle(bundle);
}

// ---------------------------------------------------------------------------
// Report formatter
// ---------------------------------------------------------------------------

/**
 * @param {{ filePath: string, valid: boolean, errors: string[] }} result
 * @returns {string}
 */
export function formatKalshiResearchReviewEvidenceBundleValidationReport({ filePath, valid, errors }) {
  const lines = [
    "Overlord KalshiResearchReviewEvidenceBundle Validation",
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
    "packages/strategy-dsl/fixtures/synthetic_kalshi_research_review_evidence_bundle.json";
  const result = validateKalshiResearchReviewEvidenceBundleFile(FIXTURE_PATH);
  const report = formatKalshiResearchReviewEvidenceBundleValidationReport({
    filePath: FIXTURE_PATH,
    ...result,
  });
  console.log(report);
  process.exit(result.valid ? 0 : 1);
}
