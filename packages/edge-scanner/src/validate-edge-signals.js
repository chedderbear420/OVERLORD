import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJsonl } from "../../event-store/src/jsonl.js";
import { edgeSignalId } from "./edge-signal-id.js";
import { netEdgeCents, rawEdgeCents } from "./edge-math.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "edge-scanner", "fixtures", "synthetic_edge_signals.jsonl");

const requiredFields = [
  "signal_id",
  "schema_version",
  "source_state_id",
  "source_event_id",
  "source_payload_hash",
  "market_id",
  "captured_at",
  "received_at",
  "side",
  "observed_price",
  "model_id",
  "model_version",
  "model_probability",
  "raw_edge",
  "estimated_fee_cost",
  "estimated_spread_cost",
  "estimated_slippage_cost",
  "uncertainty_penalty",
  "net_edge",
  "liquidity_status",
  "staleness_status",
  "quality_flags",
  "edge_status",
  "risk_status",
  "action_eligibility",
  "reason"
];

export async function validateEdgeSignalFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let records;
  try {
    records = await readJsonl(filePath);
  } catch (error) {
    return report(filePath, 0, [error.message]);
  }
  return report(filePath, records.length, validateEdgeSignalRecords(records).errors);
}

export function validateEdgeSignalRecords(records) {
  const errors = [];
  let previousReceivedAt = null;
  for (const { lineNumber, value: signal } of records) {
    for (const field of requiredFields) {
      if (!Object.hasOwn(signal, field)) {
        errors.push(issue(lineNumber, `${field} is required`));
      }
    }
    if (signal.schema_version !== undefined && signal.schema_version !== "edge_signal.v1") {
      errors.push(issue(lineNumber, "schema_version must be edge_signal.v1"));
    }
    if (signal.side !== "YES" && signal.side !== "NO") {
      errors.push(issue(lineNumber, "side must be YES or NO"));
    }
    if (signal.signal_id !== undefined && signal.source_state_id && signal.side && signal.model_id) {
      const expected = edgeSignalId({
        sourceStateId: signal.source_state_id,
        side: signal.side,
        modelId: signal.model_id
      });
      if (signal.signal_id !== expected) {
        errors.push(issue(lineNumber, "signal_id must be deterministic from source_state_id, side, and model_id"));
      }
    }
    validateProbability(errors, lineNumber, signal.model_probability);
    validateObservedPrice(errors, lineNumber, signal.observed_price);
    validateCostFields(errors, lineNumber, signal);
    validateMath(errors, lineNumber, signal);
    validateStatuses(errors, lineNumber, signal);
    previousReceivedAt = validateSignalOrder(errors, lineNumber, signal, previousReceivedAt);
  }
  return { ok: errors.length === 0, errors };
}

export function formatEdgeSignalValidationReport(validationReport) {
  const lines = [
    "Overlord EdgeSignal Validation",
    `fixture: ${validationReport.filePath}`,
    `records: ${validationReport.records}`,
    `status: ${validationReport.ok ? "PASS" : "FAIL"}`,
    `errors: ${validationReport.errors.length}`
  ];
  for (const error of validationReport.errors) {
    lines.push(`ERROR ${error}`);
  }
  return lines.join("\n");
}

function validateMath(errors, lineNumber, signal) {
  try {
    const expectedRaw = rawEdgeCents({
      modelProbability: signal.model_probability,
      observedPrice: signal.observed_price
    });
    if (signal.raw_edge !== expectedRaw) {
      errors.push(issue(lineNumber, "raw_edge must equal model_probability * 100 - observed_price"));
    }
    const expectedNet = netEdgeCents({
      rawEdge: signal.raw_edge,
      feeCost: signal.estimated_fee_cost,
      spreadCost: signal.estimated_spread_cost,
      slippageCost: signal.estimated_slippage_cost,
      uncertaintyPenalty: signal.uncertainty_penalty
    });
    if (signal.net_edge !== expectedNet) {
      errors.push(issue(lineNumber, "net_edge must equal raw_edge minus all costs and penalties"));
    }
  } catch (error) {
    errors.push(issue(lineNumber, error.message));
  }
}

function validateProbability(errors, lineNumber, probability) {
  if (typeof probability !== "number" || probability < 0 || probability > 1) {
    errors.push(issue(lineNumber, "model_probability must be between 0 and 1"));
  }
}

function validateObservedPrice(errors, lineNumber, price) {
  if (!Number.isInteger(price) || price < 0 || price > 100) {
    errors.push(issue(lineNumber, "observed_price must be an integer cent value from 0 to 100"));
  }
}

function validateCostFields(errors, lineNumber, signal) {
  for (const field of ["estimated_fee_cost", "estimated_spread_cost", "estimated_slippage_cost", "uncertainty_penalty"]) {
    if (typeof signal[field] !== "number" || Number.isNaN(signal[field]) || signal[field] < 0) {
      errors.push(issue(lineNumber, `${field} must be a non-negative number`));
    }
  }
}

function validateStatuses(errors, lineNumber, signal) {
  if (!["positive", "negative", "zero_or_insufficient", "rejected"].includes(signal.edge_status)) {
    errors.push(issue(lineNumber, "edge_status is invalid"));
  }
  if (signal.risk_status !== "not_evaluated") {
    errors.push(issue(lineNumber, "risk_status must be not_evaluated in Phase 1I"));
  }
  if (!["candidate_only", "rejected", "paper_eligible_candidate"].includes(signal.action_eligibility)) {
    errors.push(issue(lineNumber, "action_eligibility is invalid"));
  }
  if (signal.action_eligibility === "paper_eligible_candidate") {
    errors.push(issue(lineNumber, "paper_eligible_candidate is reserved until paper trading phase"));
  }
  if (signal.staleness_status !== "fresh" && signal.action_eligibility !== "rejected") {
    errors.push(issue(lineNumber, "stale signals must be rejected"));
  }
  if (signal.liquidity_status !== "liquid" && signal.action_eligibility !== "rejected") {
    errors.push(issue(lineNumber, "illiquid signals must be rejected"));
  }
  if (Array.isArray(signal.quality_flags) && signal.quality_flags.length > 0 && signal.action_eligibility !== "rejected") {
    errors.push(issue(lineNumber, "signals with quality_flags must be rejected"));
  }
}

function validateSignalOrder(errors, lineNumber, signal, previousReceivedAt) {
  const receivedAt = Date.parse(signal.received_at);
  const capturedAt = Date.parse(signal.captured_at);
  if (Number.isNaN(capturedAt) || Number.isNaN(receivedAt)) {
    errors.push(issue(lineNumber, "captured_at and received_at must be valid timestamps"));
    return previousReceivedAt;
  }
  if (receivedAt < capturedAt) {
    errors.push(issue(lineNumber, "received_at must be equal to or after captured_at"));
  }
  if (previousReceivedAt !== null && receivedAt < previousReceivedAt) {
    errors.push(issue(lineNumber, "received_at must be monotonic for signal fixture order"));
  }
  return receivedAt;
}

function report(filePath, records, errors) {
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
  const validationReport = await validateEdgeSignalFile({
    filePath: process.argv[2] ? path.resolve(process.argv[2]) : defaultFixturePath
  });
  console.log(formatEdgeSignalValidationReport(validationReport));
  process.exitCode = validationReport.ok ? 0 : 1;
}
