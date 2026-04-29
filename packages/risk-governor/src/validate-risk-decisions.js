import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJsonl } from "../../event-store/src/jsonl.js";
import { riskDecisionId } from "./risk-decision-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "risk-governor", "fixtures", "synthetic_risk_decisions.jsonl");

const requiredFields = ["risk_decision_id", "schema_version", "source_signal_id", "source_state_id", "source_event_id", "source_payload_hash", "market_id", "captured_at", "received_at", "side", "observed_price", "model_probability", "net_edge", "total_estimated_cost", "liquidity_status", "staleness_status", "quality_flags", "risk_status", "risk_reasons", "policy_id", "policy_version", "max_paper_exposure_cents"];

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
  const report = await validateRiskDecisionFile({
    filePath: process.argv[2] ? path.resolve(process.argv[2]) : defaultFixturePath
  });
  console.log(formatRiskDecisionValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
