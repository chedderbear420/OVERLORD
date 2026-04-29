import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJsonl } from "../../event-store/src/jsonl.js";
import { paperLedgerEntryId } from "./paper-ledger-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "paper-trader", "fixtures", "synthetic_paper_ledger_entries.jsonl");

const requiredFields = [
  "paper_ledger_entry_id",
  "schema_version",
  "source_action_decision_id",
  "source_risk_decision_id",
  "source_signal_id",
  "source_state_id",
  "source_event_id",
  "source_payload_hash",
  "market_id",
  "captured_at",
  "received_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "ledger_event_type",
  "side",
  "paper_entry_price",
  "max_paper_exposure_cents",
  "paper_quantity",
  "notional_cents",
  "status",
  "reason",
  "final_pnl_cents"
];

export async function validatePaperLedgerFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let records;
  try {
    records = await readJsonl(filePath);
  } catch (error) {
    return makeReport(filePath, 0, [error.message]);
  }
  return makeReport(filePath, records.length, validatePaperLedgerRecords(records).errors);
}

export function validatePaperLedgerRecords(records) {
  const errors = [];
  const ids = new Set();
  let previousReceivedAt = null;

  for (const { lineNumber, value } of records) {
    for (const field of requiredFields) {
      if (!Object.hasOwn(value, field)) {
        errors.push(issue(lineNumber, `${field} is required`));
      }
    }

    if (ids.has(value.paper_ledger_entry_id)) {
      errors.push(issue(lineNumber, "paper_ledger_entry_id must be unique"));
    }
    ids.add(value.paper_ledger_entry_id);

    if (value.schema_version !== "paper_ledger_entry.v1") {
      errors.push(issue(lineNumber, "schema_version must be paper_ledger_entry.v1"));
    }
    if (value.paper_ledger_entry_id !== paperLedgerEntryId(value.source_action_decision_id)) {
      errors.push(issue(lineNumber, "paper_ledger_entry_id must be deterministic from source_action_decision_id"));
    }
    if (value.paper_only !== true) {
      errors.push(issue(lineNumber, "paper_only must be true"));
    }
    if (value.live_execution_allowed !== false) {
      errors.push(issue(lineNumber, "live_execution_allowed must be false"));
    }
    if (value.order_placement_allowed !== false) {
      errors.push(issue(lineNumber, "order_placement_allowed must be false"));
    }
    if (!["paper_entry_recorded", "paper_entry_rejected"].includes(value.ledger_event_type)) {
      errors.push(issue(lineNumber, "ledger_event_type is invalid"));
    }
    if (!["paper_open", "paper_rejected"].includes(value.status)) {
      errors.push(issue(lineNumber, "status is invalid"));
    }
    if (value.ledger_event_type === "paper_entry_recorded" && value.status !== "paper_open") {
      errors.push(issue(lineNumber, "paper_entry_recorded entries must have paper_open status"));
    }
    if (value.ledger_event_type === "paper_entry_rejected" && value.status !== "paper_rejected") {
      errors.push(issue(lineNumber, "paper_entry_rejected entries must have paper_rejected status"));
    }
    if (!["YES", "NO"].includes(value.side)) {
      errors.push(issue(lineNumber, "side must be YES or NO"));
    }
    if (!Number.isInteger(value.paper_entry_price) || value.paper_entry_price <= 0 || value.paper_entry_price >= 100) {
      errors.push(issue(lineNumber, "paper_entry_price must be integer cents from 1 to 99"));
    }
    for (const field of ["max_paper_exposure_cents", "paper_quantity", "notional_cents"]) {
      if (!Number.isInteger(value[field]) || value[field] < 0) {
        errors.push(issue(lineNumber, `${field} must be a non-negative integer`));
      }
    }
    if (Number.isInteger(value.paper_entry_price) && Number.isInteger(value.paper_quantity) && value.notional_cents !== value.paper_entry_price * value.paper_quantity) {
      errors.push(issue(lineNumber, "notional_cents must equal paper_entry_price * paper_quantity"));
    }
    if (Number.isInteger(value.notional_cents) && Number.isInteger(value.max_paper_exposure_cents) && value.notional_cents > value.max_paper_exposure_cents) {
      errors.push(issue(lineNumber, "notional_cents must not exceed max_paper_exposure_cents"));
    }
    if (value.final_pnl_cents !== null) {
      errors.push(issue(lineNumber, "final_pnl_cents must be null until exits and settlement exist"));
    }

    previousReceivedAt = validateLedgerOrder(errors, lineNumber, value, previousReceivedAt);
  }

  return { ok: errors.length === 0, errors };
}

export function formatPaperLedgerValidationReport(report) {
  const lines = [
    "Overlord PaperLedger Validation",
    `fixture: ${report.filePath}`,
    `records: ${report.records}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) {
    lines.push(`ERROR ${error}`);
  }
  return lines.join("\n");
}

function validateLedgerOrder(errors, lineNumber, value, previousReceivedAt) {
  const capturedAt = Date.parse(value.captured_at);
  const receivedAt = Date.parse(value.received_at);
  if (Number.isNaN(capturedAt) || Number.isNaN(receivedAt)) {
    errors.push(issue(lineNumber, "captured_at and received_at must be valid timestamps"));
    return previousReceivedAt;
  }
  if (receivedAt < capturedAt) {
    errors.push(issue(lineNumber, "received_at must be equal to or after captured_at"));
  }
  if (previousReceivedAt !== null && receivedAt < previousReceivedAt) {
    errors.push(issue(lineNumber, "received_at must be monotonic for paper ledger order"));
  }
  return receivedAt;
}

function makeReport(filePath, records, errors) {
  return {
    ok: errors.length === 0,
    filePath: path.relative(repoRoot, filePath).replaceAll("\\", "/"),
    records,
    errors
  };
}

function issue(lineNumber, message) {
  return `line ${lineNumber}: ${message}`;
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const explicitPath = process.argv.find((arg) => arg.endsWith(".jsonl"));
  const report = await validatePaperLedgerFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatPaperLedgerValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
