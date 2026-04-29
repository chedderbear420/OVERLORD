import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJsonl } from "../../event-store/src/jsonl.js";
import { marketStateId } from "./market-state-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(
  repoRoot,
  "packages",
  "market-state-engine",
  "fixtures",
  "synthetic_market_states.jsonl"
);

const requiredFields = [
  "state_id",
  "schema_version",
  "source_event_id",
  "source_payload_hash",
  "source",
  "market_id",
  "captured_at",
  "received_at",
  "price_unit",
  "best_yes_bid",
  "best_yes_ask",
  "best_no_bid",
  "best_no_ask",
  "yes_spread",
  "no_spread",
  "yes_mid",
  "no_mid",
  "yes_depth",
  "no_depth",
  "book_imbalance",
  "liquidity_status",
  "staleness_status",
  "quality_flags"
];

const priceFields = ["best_yes_bid", "best_yes_ask", "best_no_bid", "best_no_ask"];

export async function validateMarketStateFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let records;

  try {
    records = await readJsonl(filePath);
  } catch (error) {
    return {
      ok: false,
      filePath: path.relative(repoRoot, filePath).replaceAll("\\", "/"),
      records: 0,
      errors: [error.message],
      warnings: []
    };
  }

  const report = validateMarketStateRecords(records);

  return {
    ok: report.ok,
    filePath: path.relative(repoRoot, filePath).replaceAll("\\", "/"),
    records: records.length,
    errors: report.errors,
    warnings: report.warnings
  };
}

export function validateMarketStateRecords(records) {
  const errors = [];
  const warnings = [];
  let previousReceivedAt = null;

  for (const { lineNumber, value: state } of records) {
    for (const field of requiredFields) {
      if (!Object.hasOwn(state, field)) {
        errors.push(formatIssue(lineNumber, `${field} is required`));
      }
    }

    if (state.schema_version !== undefined && state.schema_version !== "market_state.v1") {
      errors.push(formatIssue(lineNumber, `unsupported schema_version ${JSON.stringify(state.schema_version)}`));
    }

    if (state.source_event_id !== undefined && state.state_id !== marketStateId(state.source_event_id)) {
      errors.push(formatIssue(lineNumber, "state_id must equal ms_<source_event_id>"));
    }

    if (state.source_payload_hash !== undefined && !/^sha256:[a-f0-9]{64}$/.test(state.source_payload_hash)) {
      errors.push(formatIssue(lineNumber, "source_payload_hash must match sha256:<64 lowercase hex chars>"));
    }

    if (state.price_unit !== undefined && state.price_unit !== "cents") {
      errors.push(formatIssue(lineNumber, "price_unit must be cents"));
    }

    validatePriceBounds(errors, lineNumber, state);
    validateDepths(errors, lineNumber, state);
    validateSpreadMath(errors, lineNumber, state);
    validateMidMath(errors, lineNumber, state);
    validateBookImbalance(errors, lineNumber, state);
    validateStatuses(errors, lineNumber, state);
    previousReceivedAt = validateReplayClock(errors, lineNumber, state, previousReceivedAt);
  }

  return {
    ok: errors.length === 0,
    records: records.length,
    errors,
    warnings
  };
}

export function formatMarketStateValidationReport(report) {
  const lines = [
    "Overlord MarketState Validation",
    `fixture: ${report.filePath}`,
    `records: ${report.records}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`,
    `warnings: ${report.warnings.length}`
  ];

  for (const error of report.errors) {
    lines.push(`ERROR ${error}`);
  }

  for (const warning of report.warnings) {
    lines.push(`WARN ${warning}`);
  }

  return lines.join("\n");
}

function validatePriceBounds(errors, lineNumber, state) {
  for (const field of priceFields) {
    const value = state[field];
    if (value === null) {
      continue;
    }

    if (!Number.isInteger(value) || value < 0 || value > 100) {
      errors.push(formatIssue(lineNumber, `${field} must be an integer cent value from 0 to 100 or null`));
    }
  }
}

function validateDepths(errors, lineNumber, state) {
  for (const field of ["yes_depth", "no_depth"]) {
    const value = state[field];
    if (!Number.isInteger(value) || value < 0) {
      errors.push(formatIssue(lineNumber, `${field} must be a non-negative integer`));
    }
  }
}

function validateSpreadMath(errors, lineNumber, state) {
  validateOneSpread(errors, lineNumber, state, "yes_spread", "best_yes_bid", "best_yes_ask");
  validateOneSpread(errors, lineNumber, state, "no_spread", "best_no_bid", "best_no_ask");
}

function validateOneSpread(errors, lineNumber, state, spreadField, bidField, askField) {
  const bid = state[bidField];
  const ask = state[askField];
  const actual = state[spreadField];
  const expected = bid === null || ask === null ? null : ask - bid;

  if (actual !== expected) {
    errors.push(formatIssue(lineNumber, `${spreadField} must equal ${askField} - ${bidField}`));
  }
}

function validateMidMath(errors, lineNumber, state) {
  validateOneMid(errors, lineNumber, state, "yes_mid", "best_yes_bid", "best_yes_ask");
  validateOneMid(errors, lineNumber, state, "no_mid", "best_no_bid", "best_no_ask");
}

function validateOneMid(errors, lineNumber, state, midField, bidField, askField) {
  const bid = state[bidField];
  const ask = state[askField];
  const actual = state[midField];
  const expected = bid === null || ask === null ? null : (bid + ask) / 2;

  if (actual !== expected) {
    errors.push(formatIssue(lineNumber, `${midField} must equal midpoint of ${bidField} and ${askField}`));
  }
}

function validateBookImbalance(errors, lineNumber, state) {
  const totalDepth = state.yes_depth + state.no_depth;
  const expected = totalDepth === 0 ? null : (state.yes_depth - state.no_depth) / totalDepth;

  if (state.book_imbalance !== expected) {
    errors.push(formatIssue(lineNumber, "book_imbalance must equal (yes_depth - no_depth) / total_depth"));
  }
}

function validateStatuses(errors, lineNumber, state) {
  if (!["empty", "thin", "liquid", "invalid"].includes(state.liquidity_status)) {
    errors.push(formatIssue(lineNumber, "liquidity_status is invalid"));
  }

  if (!["fresh", "stale", "missing_timestamp", "future_timestamp", "invalid_timestamp"].includes(state.staleness_status)) {
    errors.push(formatIssue(lineNumber, "staleness_status is invalid"));
  }

  if (!Array.isArray(state.quality_flags) || !state.quality_flags.every((flag) => typeof flag === "string")) {
    errors.push(formatIssue(lineNumber, "quality_flags must be an array of strings"));
  }
}

function validateReplayClock(errors, lineNumber, state, previousReceivedAt) {
  const capturedAt = Date.parse(state.captured_at);
  const receivedAt = Date.parse(state.received_at);

  if (Number.isNaN(capturedAt) || Number.isNaN(receivedAt)) {
    errors.push(formatIssue(lineNumber, "captured_at and received_at must be valid timestamps"));
    return previousReceivedAt;
  }

  if (receivedAt < capturedAt) {
    errors.push(formatIssue(lineNumber, "received_at must be equal to or after captured_at"));
  }

  if (previousReceivedAt !== null && receivedAt < previousReceivedAt) {
    errors.push(formatIssue(lineNumber, "received_at must be monotonic for replay fixture order"));
  }

  return receivedAt;
}

function formatIssue(lineNumber, message) {
  return `line ${lineNumber}: ${message}`;
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const report = await validateMarketStateFile({
    filePath: process.argv[2] ? path.resolve(process.argv[2]) : defaultFixturePath
  });
  console.log(formatMarketStateValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
