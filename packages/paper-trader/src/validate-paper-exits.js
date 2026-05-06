import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJsonl } from "../../event-store/src/jsonl.js";
import { paperExitId } from "./paper-exit-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "paper-trader", "fixtures", "synthetic_paper_exits.jsonl");

const requiredFields = [
  "paper_exit_id",
  "schema_version",
  "source_paper_ledger_entry_id",
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
  "exit_event_type",
  "side",
  "paper_entry_price",
  "paper_exit_price",
  "paper_quantity",
  "entry_notional_cents",
  "exit_notional_cents",
  "gross_pnl_cents",
  "estimated_fee_cents",
  "net_pnl_cents",
  "status",
  "reason"
];

export async function validatePaperExitFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let records;
  try {
    records = await readJsonl(filePath);
  } catch (error) {
    return makeReport(filePath, 0, [error.message]);
  }
  return makeReport(filePath, records.length, validatePaperExitRecords(records).errors);
}

export function validatePaperExitRecords(records) {
  const errors = [];
  const ids = new Set();
  let previousReceivedAt = null;

  for (const { lineNumber, value } of records) {
    for (const field of requiredFields) {
      if (!Object.hasOwn(value, field)) {
        errors.push(issue(lineNumber, `${field} is required`));
      }
    }

    if (ids.has(value.paper_exit_id)) {
      errors.push(issue(lineNumber, "paper_exit_id must be unique"));
    }
    ids.add(value.paper_exit_id);

    if (value.schema_version !== "paper_exit.v1") {
      errors.push(issue(lineNumber, "schema_version must be paper_exit.v1"));
    }
    if (value.paper_exit_id !== paperExitId(value.source_paper_ledger_entry_id, value.received_at)) {
      errors.push(issue(lineNumber, "paper_exit_id must be deterministic from source_paper_ledger_entry_id and received_at"));
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
    if (!["paper_exit_recorded", "paper_exit_rejected"].includes(value.exit_event_type)) {
      errors.push(issue(lineNumber, "exit_event_type is invalid"));
    }
    if (!["paper_closed", "paper_exit_rejected"].includes(value.status)) {
      errors.push(issue(lineNumber, "status is invalid"));
    }
    if (value.exit_event_type === "paper_exit_recorded" && value.status !== "paper_closed") {
      errors.push(issue(lineNumber, "paper_exit_recorded exits must have paper_closed status"));
    }
    if (value.exit_event_type === "paper_exit_rejected" && value.status !== "paper_exit_rejected") {
      errors.push(issue(lineNumber, "paper_exit_rejected exits must have paper_exit_rejected status"));
    }
    if (!["YES", "NO"].includes(value.side)) {
      errors.push(issue(lineNumber, "side must be YES or NO"));
    }
    for (const field of ["paper_entry_price", "paper_exit_price"]) {
      if (!Number.isInteger(value[field]) || value[field] < 0 || value[field] > 100) {
        errors.push(issue(lineNumber, `${field} must be integer cents from 0 to 100`));
      }
    }
    if (value.status === "paper_closed" && (!Number.isInteger(value.paper_quantity) || value.paper_quantity <= 0)) {
      errors.push(issue(lineNumber, "paper_quantity must be a positive integer for paper_closed exits"));
    }
    for (const field of ["paper_quantity", "entry_notional_cents", "exit_notional_cents", "estimated_fee_cents"]) {
      if (!Number.isInteger(value[field]) || value[field] < 0) {
        errors.push(issue(lineNumber, `${field} must be a non-negative integer`));
      }
    }
    for (const field of ["gross_pnl_cents", "net_pnl_cents"]) {
      if (!Number.isInteger(value[field])) {
        errors.push(issue(lineNumber, `${field} must be an integer`));
      }
    }
    if (Number.isInteger(value.paper_entry_price) && Number.isInteger(value.paper_quantity) && value.entry_notional_cents !== value.paper_entry_price * value.paper_quantity) {
      errors.push(issue(lineNumber, "entry_notional_cents must equal paper_entry_price * paper_quantity"));
    }
    if (Number.isInteger(value.paper_exit_price) && Number.isInteger(value.paper_quantity) && value.exit_notional_cents !== value.paper_exit_price * value.paper_quantity) {
      errors.push(issue(lineNumber, "exit_notional_cents must equal paper_exit_price * paper_quantity"));
    }
    if (Number.isInteger(value.entry_notional_cents) && Number.isInteger(value.exit_notional_cents) && value.gross_pnl_cents !== value.exit_notional_cents - value.entry_notional_cents) {
      errors.push(issue(lineNumber, "gross_pnl_cents must equal exit_notional_cents - entry_notional_cents"));
    }
    if (Number.isInteger(value.gross_pnl_cents) && Number.isInteger(value.estimated_fee_cents) && value.net_pnl_cents !== value.gross_pnl_cents - value.estimated_fee_cents) {
      errors.push(issue(lineNumber, "net_pnl_cents must equal gross_pnl_cents - estimated_fee_cents"));
    }

    previousReceivedAt = validateExitOrder(errors, lineNumber, value, previousReceivedAt);
  }

  return { ok: errors.length === 0, errors };
}

export function formatPaperExitValidationReport(report) {
  const lines = [
    "Overlord PaperExit Validation",
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

function validateExitOrder(errors, lineNumber, value, previousReceivedAt) {
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
    errors.push(issue(lineNumber, "received_at must be monotonic for paper exit order"));
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
  const report = await validatePaperExitFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatPaperExitValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
