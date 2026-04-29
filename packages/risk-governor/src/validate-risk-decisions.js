import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJsonl } from "../../event-store/src/jsonl.js";
import { actionDecisionId, riskDecisionId } from "./risk-decision-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "risk-governor", "fixtures", "synthetic_risk_decisions.jsonl");
const defaultActionFixturePath = path.join(repoRoot, "packages", "risk-governor", "fixtures", "synthetic_action_decisions.jsonl");

const requiredFields = ["risk_decision_id", "schema_version", "source_signal_id", "source_state_id", "source_event_id", "source_payload_hash", "market_id", "captured_at", "received_at", "side", "observed_price", "model_probability", "net_edge", "total_estimated_cost", "liquidity_status", "staleness_status", "quality_flags", "risk_status", "risk_reasons", "policy_id", "policy_version", "max_paper_exposure_cents"];
const actionRequiredFields = ["action_decision_id", "schema_version", "source_risk_decision_id", "source_signal_id", "source_state_id", "source_event_id", "source_payload_hash", "market_id", "captured_at", "received_at", "action_status", "paper_only", "live_execution_allowed", "order_placement_allowed", "max_paper_exposure_cents", "reason"];

export async function validateRiskDecisionFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let records;
  try {
    records = await readJsonl(filePath);
  } catch (error) {
    return makeReport(filePath, 0, [error.message]);
  }
  return makeReport(filePath, records.length, validateRiskDecisionRecords(records).errors);
}

export function validateRiskDecisionRecords(records) {
  const errors = [];
  let previousReceivedAt = null;
  for (const { lineNumber, value } of records) {
    for (const field of requiredFields) {
      if (!Object.hasOwn(value, field)) {
        errors.push(issue(lineNumber, `${field} is required`));
      }
    }
    if (value.schema_version !== "risk_decision.v1") {
      errors.push(issue(lineNumber, "schema_version must be risk_decision.v1"));
    }
    if (value.risk_decision_id !== riskDecisionId(value.source_signal_id, value.policy_id)) {
      errors.push(issue(lineNumber, "risk_decision_id must be deterministic from source_signal_id and policy_id"));
    }
    if (!["YES", "NO"].includes(value.side)) {
      errors.push(issue(lineNumber, "side must be YES or NO"));
    }
    if (!["risk_approved", "risk_rejected", "risk_needs_review"].includes(value.risk_status)) {
      errors.push(issue(lineNumber, "risk_status is invalid"));
    }
    if (!Array.isArray(value.risk_reasons) || value.risk_reasons.length === 0) {
      errors.push(issue(lineNumber, "risk_reasons must be a non-empty array"));
    }
    if (value.risk_status === "risk_approved" && !value.risk_reasons.includes("all_risk_checks_passed")) {
      errors.push(issue(lineNumber, "risk_approved decisions must include all_risk_checks_passed"));
    }
    previousReceivedAt = validateDecisionOrder(errors, lineNumber, value, previousReceivedAt);
  }
  return { ok: errors.length === 0, errors };
}

export async function validateActionDecisionFile(options = {}) {
  const filePath = options.filePath ?? defaultActionFixturePath;
  let records;
  try {
    records = await readJsonl(filePath);
  } catch (error) {
    return makeReport(filePath, 0, [error.message]);
  }
  return makeReport(filePath, records.length, validateActionDecisionRecords(records, options).errors);
}

export function validateActionDecisionRecords(records, options = {}) {
  const errors = [];
  const riskDecisionsById = options.riskDecisionsById ?? new Map();
  let previousReceivedAt = null;

  for (const { lineNumber, value } of records) {
    for (const field of actionRequiredFields) {
      if (!Object.hasOwn(value, field)) {
        errors.push(issue(lineNumber, `${field} is required`));
      }
    }
    if (value.schema_version !== "action_decision.v1") {
      errors.push(issue(lineNumber, "schema_version must be action_decision.v1"));
    }
    if (value.action_decision_id !== actionDecisionId(value.source_risk_decision_id)) {
      errors.push(issue(lineNumber, "action_decision_id must be deterministic from source_risk_decision_id"));
    }
    if (!["no_action", "rejected", "paper_candidate_allowed"].includes(value.action_status)) {
      errors.push(issue(lineNumber, "action_status is invalid"));
    }
    if (value.live_execution_allowed !== false) {
      errors.push(issue(lineNumber, "live_execution_allowed must be false"));
    }
    if (value.order_placement_allowed !== false) {
      errors.push(issue(lineNumber, "order_placement_allowed must be false"));
    }
    if (value.paper_only !== true) {
      errors.push(issue(lineNumber, "paper_only must be true"));
    }
    if (!Number.isInteger(value.max_paper_exposure_cents) || value.max_paper_exposure_cents < 0) {
      errors.push(issue(lineNumber, "max_paper_exposure_cents must be a non-negative integer"));
    }
    validateActionRiskMapping(errors, lineNumber, value, riskDecisionsById.get(value.source_risk_decision_id));
    previousReceivedAt = validateDecisionOrder(errors, lineNumber, value, previousReceivedAt);
  }

  return { ok: errors.length === 0, errors };
}

export function formatRiskDecisionValidationReport(report) {
  const lines = [
    "Overlord RiskDecision Validation",
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

export function formatActionDecisionValidationReport(report) {
  const lines = [
    "Overlord ActionDecision Validation",
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

function validateActionRiskMapping(errors, lineNumber, action, riskDecision) {
  if (!riskDecision) {
    return;
  }
  if (riskDecision.risk_status === "risk_approved" && action.action_status !== "paper_candidate_allowed" && !action.reason.includes("explicitly justified")) {
    errors.push(issue(lineNumber, "risk_approved actions must be paper_candidate_allowed unless explicitly justified"));
  }
  if (riskDecision.risk_status === "risk_rejected" && action.action_status === "paper_candidate_allowed") {
    errors.push(issue(lineNumber, "risk_rejected actions cannot be paper_candidate_allowed"));
  }
  if (riskDecision.risk_status === "risk_needs_review" && action.action_status === "paper_candidate_allowed") {
    errors.push(issue(lineNumber, "risk_needs_review actions cannot be paper_candidate_allowed"));
  }
}

function validateDecisionOrder(errors, lineNumber, value, previousReceivedAt) {
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
    errors.push(issue(lineNumber, "received_at must be monotonic for decision fixture order"));
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
  const validateActions = process.argv.includes("--actions");
  const explicitPath = process.argv.find((arg) => arg.endsWith(".jsonl"));
  const report = validateActions
    ? await validateActionDecisionFile({ filePath: explicitPath ? path.resolve(explicitPath) : defaultActionFixturePath })
    : await validateRiskDecisionFile({ filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath });
  console.log(validateActions ? formatActionDecisionValidationReport(report) : formatRiskDecisionValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
