import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { validateNoUnknownFields } from "./strategy-observation-boundary-guard.js";
import { kalshiPaperLedgerEntryId } from "./kalshi-paper-ledger-entry-id.js";
import {
  APPROVED_LEDGER_MODES,
  APPROVED_PAPER_ACCOUNTING_MODES,
  APPROVED_PAPER_CONTRACT_SIDES,
  APPROVED_PAPER_SETTLEMENT_STATUSES,
  APPROVED_PAPER_ENTRY_STATUSES,
  APPROVED_PAPER_OUTCOME_STATUSES,
  APPROVED_CONDITION_FAMILIES,
} from "./build-kalshi-paper-ledger-entry.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(
  repoRoot,
  "packages",
  "strategy-dsl",
  "fixtures",
  "synthetic_kalshi_paper_ledger_entry.json"
);

// Approved required fields in the contract order.
const requiredFields = [
  "kalshi_paper_ledger_entry_id",
  "schema_version",
  "generated_at",
  "ledger_mode",
  "source_phase",
  "signal_evaluation_summary_id",
  "signal_evaluation_summary_schema_version",
  "market_snapshot_id",
  "market_snapshot_schema_version",
  "input_artifact_refs",
  "paper_accounting_mode",
  "paper_entry_status",
  "paper_outcome_status",
  "market_ticker",
  "event_ticker",
  "condition_family",
  "paper_contract_side",
  "paper_units",
  "paper_entry_price_cents",
  "paper_mark_price_cents",
  "paper_unrealized_pnl_cents",
  "paper_realized_pnl_cents",
  "paper_fees_cents",
  "paper_net_pnl_cents",
  "paper_settlement_status",
  "research_notes",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "credentials_used",
  "network_request_used",
  "emits_signal_events",
  "emits_recommendations",
  "emits_decisions",
  "emits_orders",
  "emits_live_positions",
  "emits_paper_ledger_entries",
  "reason_code",
  "reason",
];

// Field names that must never appear at any depth.
// NOTE: Approved structural field names below are NOT in this set:
//   kalshi_paper_ledger_entry_id, paper_accounting_mode, paper_entry_status,
//   paper_outcome_status, paper_contract_side, paper_units,
//   paper_entry_price_cents, paper_mark_price_cents, paper_unrealized_pnl_cents,
//   paper_realized_pnl_cents, paper_fees_cents, paper_net_pnl_cents,
//   paper_settlement_status, emits_live_positions — all use exact-key matching
//   and none collide with this set.
const forbiddenImplementationFields = new Set([
  "signal", "signal_event",
  "pick", "recommendation", "decision",
  "order", "trade", "execution",
  "bankroll", "position_size", "expected_value", "edge",
  "buy", "sell", "bet", "wager", "stake", "kelly",
  "api_key", "token", "secret", "credential", "credentials",
  "fetch", "axios", "websocket", "polling", "cron",
]);

// Top-level keys exempt from free-text string scanning (structural / ID / const fields).
const exemptFromStringValueScan = new Set([
  "kalshi_paper_ledger_entry_id",
  "schema_version",
  "generated_at",
  "ledger_mode",
  "source_phase",
  "signal_evaluation_summary_id",
  "signal_evaluation_summary_schema_version",
  "market_snapshot_id",
  "market_snapshot_schema_version",
  "input_artifact_refs",     // object — validated structurally
  "paper_accounting_mode",
  "paper_entry_status",
  "paper_outcome_status",
  "market_ticker",
  "event_ticker",
  "condition_family",
  "paper_contract_side",
  "paper_settlement_status",
  "research_notes",        // object — validated structurally; sub-keys are controlled consts
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

export async function validateKalshiPaperLedgerEntryFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let entry;
  try {
    entry = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, validateKalshiPaperLedgerEntry(entry).errors);
}

export function validateKalshiPaperLedgerEntry(entry) {
  const errors = [];

  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    return { ok: false, errors: ["KalshiPaperLedgerEntry must be a JSON object"] };
  }

  // Field whitelist
  const unknownErrors = [];
  validateNoUnknownFields(unknownErrors, entry, requiredFields, "KalshiPaperLedgerEntry");
  for (const e of unknownErrors) errors.push(`${e.reason_code}: ${e.message}`);

  for (const field of requiredFields) {
    if (!Object.hasOwn(entry, field)) errors.push(`${field} is required`);
  }

  validateCoreFields(errors, entry);
  validateSafetyFlags(errors, entry);
  validateDeterministicId(errors, entry);
  validateInputArtifactRefs(errors, entry);
  validatePaperEconomics(errors, entry);
  validateResearchNotes(errors, entry);
  validateForbiddenImplementationFields(errors, entry);
  validateForbiddenStringValues(errors, entry);

  return { ok: errors.length === 0, errors };
}

export function formatKalshiPaperLedgerEntryValidationReport(report) {
  const lines = [
    "Overlord KalshiPaperLedgerEntry Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`,
  ];
  for (const error of report.errors) lines.push(`ERROR ${error}`);
  return lines.join("\n");
}

// ─── Validation helpers ───────────────────────────────────────────────────────

function validateCoreFields(errors, entry) {
  if (entry.schema_version !== "kalshi_paper_ledger_entry.v1") {
    errors.push("schema_version must be kalshi_paper_ledger_entry.v1");
  }
  if (!entry.generated_at || Number.isNaN(Date.parse(entry.generated_at))) {
    errors.push("generated_at must be a valid ISO 8601 timestamp");
  }
  if (entry.source_phase !== "Phase 4P") {
    errors.push("source_phase must be Phase 4P");
  }
  if (!APPROVED_LEDGER_MODES.has(entry.ledger_mode)) {
    errors.push(`ledger_mode must be one of: ${[...APPROVED_LEDGER_MODES].join(", ")}`);
  }
  if (!APPROVED_PAPER_ACCOUNTING_MODES.has(entry.paper_accounting_mode)) {
    errors.push(
      `paper_accounting_mode must be one of: ${[...APPROVED_PAPER_ACCOUNTING_MODES].join(", ")}`
    );
  }
  if (!APPROVED_PAPER_ENTRY_STATUSES.has(entry.paper_entry_status)) {
    errors.push(
      `paper_entry_status must be one of: ${[...APPROVED_PAPER_ENTRY_STATUSES].join(", ")}`
    );
  }
  if (!APPROVED_PAPER_OUTCOME_STATUSES.has(entry.paper_outcome_status)) {
    errors.push(
      `paper_outcome_status must be one of: ${[...APPROVED_PAPER_OUTCOME_STATUSES].join(", ")}`
    );
  }
  if (!APPROVED_PAPER_CONTRACT_SIDES.has(entry.paper_contract_side)) {
    errors.push(
      `paper_contract_side must be one of: ${[...APPROVED_PAPER_CONTRACT_SIDES].join(", ")}`
    );
  }
  if (!APPROVED_CONDITION_FAMILIES.has(entry.condition_family)) {
    errors.push(
      `condition_family must be one of: ${[...APPROVED_CONDITION_FAMILIES].join(", ")}`
    );
  }
  if (
    typeof entry.signal_evaluation_summary_id !== "string" ||
    !/^kses_[a-f0-9]{32}$/.test(entry.signal_evaluation_summary_id)
  ) {
    errors.push("signal_evaluation_summary_id must be a kses_-prefixed 32-hex-char ID");
  }
  if (entry.signal_evaluation_summary_schema_version !== "kalshi_signal_evaluation_summary.v1") {
    errors.push(
      "signal_evaluation_summary_schema_version must be kalshi_signal_evaluation_summary.v1"
    );
  }
  if (
    typeof entry.market_snapshot_id !== "string" ||
    !/^kms_[a-f0-9]{32}$/.test(entry.market_snapshot_id)
  ) {
    errors.push("market_snapshot_id must be a kms_-prefixed 32-hex-char ID");
  }
  if (entry.market_snapshot_schema_version !== "kalshi_market_snapshot.v1") {
    errors.push("market_snapshot_schema_version must be kalshi_market_snapshot.v1");
  }
  if (typeof entry.market_ticker !== "string" || entry.market_ticker.length === 0) {
    errors.push("market_ticker must be a non-empty string");
  }
  if (typeof entry.event_ticker !== "string" || entry.event_ticker.length === 0) {
    errors.push("event_ticker must be a non-empty string");
  }
  if (entry.paper_units !== 1) {
    errors.push("paper_units must be 1");
  }
  if (!APPROVED_PAPER_SETTLEMENT_STATUSES.has(entry.paper_settlement_status)) {
    errors.push(
      `paper_settlement_status must be one of: ${[...APPROVED_PAPER_SETTLEMENT_STATUSES].join(", ")}`
    );
  }
  if (entry.reason_code !== "PAPER_LEDGER_ENTRY_RECORDED") {
    errors.push("reason_code must be PAPER_LEDGER_ENTRY_RECORDED");
  }
  if (typeof entry.reason !== "string" || entry.reason.length === 0) {
    errors.push("reason must be a non-empty string");
  }
}

function validateSafetyFlags(errors, entry) {
  if (entry.paper_only !== true) errors.push("paper_only must be true");
  if (entry.live_execution_allowed !== false) errors.push("live_execution_allowed must be false");
  if (entry.order_placement_allowed !== false) errors.push("order_placement_allowed must be false");
  if (entry.credentials_used !== false) errors.push("credentials_used must be false");
  if (entry.network_request_used !== false) errors.push("network_request_used must be false");
  if (entry.emits_signal_events !== false) {
    errors.push("emits_signal_events must be false — Phase 4P does not emit signal events");
  }
  if (entry.emits_recommendations !== false) {
    errors.push("emits_recommendations must be false — Phase 4P does not emit recommendations");
  }
  if (entry.emits_decisions !== false) {
    errors.push("emits_decisions must be false — Phase 4P does not emit decisions");
  }
  if (entry.emits_orders !== false) {
    errors.push("emits_orders must be false — Phase 4P does not emit orders");
  }
  if (entry.emits_live_positions !== false) {
    errors.push("emits_live_positions must be false — Phase 4P does not emit live positions");
  }
  if (entry.emits_paper_ledger_entries !== false) {
    errors.push(
      "emits_paper_ledger_entries must be false — Phase 4P records but does not emit paper ledger entries"
    );
  }
}

function validateDeterministicId(errors, entry) {
  if (
    typeof entry.signal_evaluation_summary_id !== "string" ||
    typeof entry.market_snapshot_id !== "string" ||
    typeof entry.ledger_mode !== "string" ||
    typeof entry.paper_accounting_mode !== "string" ||
    typeof entry.paper_contract_side !== "string"
  )
    return;

  const expected = kalshiPaperLedgerEntryId({
    signalEvaluationSummaryId: entry.signal_evaluation_summary_id,
    marketSnapshotId: entry.market_snapshot_id,
    ledgerMode: entry.ledger_mode,
    schemaVersion: "kalshi_paper_ledger_entry.v1",
    paperAccountingMode: entry.paper_accounting_mode,
    paperContractSide: entry.paper_contract_side,
  });
  if (entry.kalshi_paper_ledger_entry_id !== expected) {
    errors.push(
      "kalshi_paper_ledger_entry_id must be deterministic from signal_evaluation_summary_id, market_snapshot_id, ledger_mode, schema_version, paper_accounting_mode, paper_contract_side"
    );
  }
}

function validateInputArtifactRefs(errors, entry) {
  const refs = entry.input_artifact_refs;
  if (!refs || typeof refs !== "object" || Array.isArray(refs)) {
    errors.push("input_artifact_refs must be an object");
    return;
  }

  // signal_evaluation_summary ref
  const evalRef = refs.signal_evaluation_summary;
  if (!evalRef || typeof evalRef !== "object" || Array.isArray(evalRef)) {
    errors.push("input_artifact_refs.signal_evaluation_summary must be an object");
  } else {
    if (evalRef.artifact_id !== entry.signal_evaluation_summary_id) {
      errors.push(
        "input_artifact_refs.signal_evaluation_summary.artifact_id must match signal_evaluation_summary_id"
      );
    }
    if (evalRef.schema_version !== "kalshi_signal_evaluation_summary.v1") {
      errors.push(
        "input_artifact_refs.signal_evaluation_summary.schema_version must be kalshi_signal_evaluation_summary.v1"
      );
    }
  }

  // market_snapshot ref
  const snapRef = refs.market_snapshot;
  if (!snapRef || typeof snapRef !== "object" || Array.isArray(snapRef)) {
    errors.push("input_artifact_refs.market_snapshot must be an object");
  } else {
    if (snapRef.artifact_id !== entry.market_snapshot_id) {
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

function validatePaperEconomics(errors, entry) {
  if (!Number.isInteger(entry.paper_entry_price_cents)) {
    errors.push("paper_entry_price_cents must be an integer");
  }
  if (!Number.isInteger(entry.paper_mark_price_cents)) {
    errors.push("paper_mark_price_cents must be an integer");
  }
  if (!Number.isInteger(entry.paper_unrealized_pnl_cents)) {
    errors.push("paper_unrealized_pnl_cents must be an integer");
  }
  if (entry.paper_realized_pnl_cents !== null) {
    errors.push(
      "paper_realized_pnl_cents must be null for unsettled_fixture paper ledger entries"
    );
  }
  if (!Number.isInteger(entry.paper_fees_cents)) {
    errors.push("paper_fees_cents must be an integer");
  }
  if (!Number.isInteger(entry.paper_net_pnl_cents)) {
    errors.push("paper_net_pnl_cents must be an integer");
  }

  // paper_net_pnl_cents must equal paper_unrealized_pnl_cents - paper_fees_cents.
  if (
    Number.isInteger(entry.paper_unrealized_pnl_cents) &&
    Number.isInteger(entry.paper_fees_cents) &&
    Number.isInteger(entry.paper_net_pnl_cents)
  ) {
    const expectedNet = entry.paper_unrealized_pnl_cents - entry.paper_fees_cents;
    if (entry.paper_net_pnl_cents !== expectedNet) {
      errors.push(
        `paper_net_pnl_cents must equal paper_unrealized_pnl_cents - paper_fees_cents (expected ${expectedNet}, got ${entry.paper_net_pnl_cents})`
      );
    }
  }
}

function validateResearchNotes(errors, entry) {
  const rn = entry.research_notes;
  if (!rn || typeof rn !== "object" || Array.isArray(rn)) {
    errors.push("research_notes must be an object");
    return;
  }

  // No extra keys allowed.
  const approvedKeys = new Set(["source_evaluation_status", "ledger_entry_scope", "runtime_reference"]);
  for (const key of Object.keys(rn)) {
    if (!approvedKeys.has(key)) {
      errors.push(`research_notes: unknown key "${key}"`);
    }
  }

  if (rn.source_evaluation_status !== "evaluated_non_actionable") {
    errors.push(
      'research_notes.source_evaluation_status must be "evaluated_non_actionable"'
    );
  }
  if (rn.ledger_entry_scope !== "paper_only_observation") {
    errors.push('research_notes.ledger_entry_scope must be "paper_only_observation"');
  }
  if (rn.runtime_reference !== "none") {
    errors.push('research_notes.runtime_reference must be "none"');
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
      errors.push(`forbidden paper ledger entry field detected: ${fieldPath}`);
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
          `forbidden paper ledger entry string value at ${fieldPath}: contains "${label}"`
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
  const report = await validateKalshiPaperLedgerEntryFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath,
  });
  console.log(formatKalshiPaperLedgerEntryValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
