import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { validateNoUnknownFields } from "./strategy-observation-boundary-guard.js";
import { kalshiMarketSnapshotId } from "./kalshi-market-snapshot-id.js";
import { ADAPTER_CONTRACT_ID } from "./build-kalshi-market-snapshot.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(
  repoRoot,
  "packages",
  "strategy-dsl",
  "fixtures",
  "synthetic_kalshi_market_snapshot.json"
);

const requiredFields = [
  "kalshi_market_snapshot_id",
  "schema_version",
  "generated_at",
  "source_system",
  "source_fixture_path",
  "adapter_contract_id",
  "ingest_mode",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "credentials_used",
  "authenticated_request_used",
  "network_request_used",
  "market_ticker",
  "event_ticker",
  "title",
  "market_status",
  "yes_ask_cents",
  "yes_bid_cents",
  "no_ask_cents",
  "no_bid_cents",
  "last_price_cents",
  "volume",
  "open_interest",
  "expiration_time",
  "close_time",
  "result",
  "can_close_early",
  "data_quality_status",
  "ingest_warnings",
  "reason_code",
  "reason",
];

// Fields that must never appear as keys — they indicate smuggled execution,
// credential, account, or signal data.
const forbiddenImplementationFields = new Set([
  "fetch", "axios", "http_client", "websocket", "socket",
  "api_key", "api_secret", "token", "bearer", "secret", "auth_token", "private_key",
  "poll", "polling_interval", "cron", "timer", "interval",
  "order", "order_id", "order_request", "trade_request",
  "signal", "recommendation", "pick", "decision",
  "bankroll", "bankroll_allocation", "kelly_fraction", "position_size",
  "expected_value", "edge",
  "base_url", "endpoint_url", "live_url",
  "account_id", "account_balance", "balance", "portfolio", "position",
  "execution", "fill",
]);

// Enum-constrained or ID fields — exempt from free-text string-value scan.
// NOTE: ingest_warnings is intentionally NOT exempt — it is free-text and must be scanned.
const exemptFromStringValueScan = new Set([
  "kalshi_market_snapshot_id",
  "schema_version",
  "generated_at",
  "source_system",
  "source_fixture_path",
  "adapter_contract_id",
  "ingest_mode",
  "reason_code",
  "data_quality_status",
  "market_ticker",
  "event_ticker",
  "expiration_time",
  "close_time",
  "result",
]);

// Word-boundary-aware patterns for forbidden language in free-text string values.
const forbiddenStringValuePatterns = [
  { pattern: /\bcredentials?\b/iu, label: "credential" },
  { pattern: /\bapi[\s_]key\b/iu, label: "api key" },
  { pattern: /\btoken\b/iu, label: "token" },
  { pattern: /\bbearer\b/iu, label: "bearer" },
  { pattern: /\bsecret\b/iu, label: "secret" },
  { pattern: /\bprivate[\s_]key\b/iu, label: "private key" },
  { pattern: /\bfetch\b/iu, label: "fetch" },
  { pattern: /\baxios\b/iu, label: "axios" },
  { pattern: /\bwebsockets?\b/iu, label: "websocket" },
  { pattern: /\bsockets?\b/iu, label: "socket" },
  { pattern: /\bpolling\b/iu, label: "polling" },
  { pattern: /\bcron\b/iu, label: "cron" },
  { pattern: /\btimers?\b/iu, label: "timer" },
  { pattern: /\binterval\b/iu, label: "interval" },
  { pattern: /\borders?(?:ing|ed)?\b/iu, label: "order" },
  { pattern: /\btrades?\b|\btrading\b/iu, label: "trade" },
  { pattern: /\bexecut(?:e|ion|ing)\b/iu, label: "execution" },
  { pattern: /\bpositions?\b/iu, label: "position" },
  { pattern: /\bportfolio\b/iu, label: "portfolio" },
  { pattern: /\bbalance\b/iu, label: "balance" },
  { pattern: /\baccount\b/iu, label: "account" },
  { pattern: /\bdeposit\b/iu, label: "deposit" },
  { pattern: /\bwithdrawals?\b|\bwithdraw\b/iu, label: "withdrawal" },
  { pattern: /\bsignals?\b/iu, label: "signal" },
  { pattern: /\brecommendations?\b/iu, label: "recommendation" },
  { pattern: /\bpicks?\b/iu, label: "pick" },
  { pattern: /\bdecisions?\b/iu, label: "decision" },
  { pattern: /\bbankroll\b/iu, label: "bankroll" },
  { pattern: /\bposition[\s_]size\b/iu, label: "position size" },
  { pattern: /\bkelly\b/iu, label: "kelly" },
  { pattern: /\bexpected[\s_]value\b/iu, label: "expected value" },
  { pattern: /\bedge\b/iu, label: "edge" },
];

const allowedDataQualityStatuses = new Set(["complete", "partial", "missing"]);
const allowedIngestModes = new Set(["local_fixture_only"]);

export async function validateKalshiMarketSnapshotFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let snapshot;
  try {
    snapshot = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, validateKalshiMarketSnapshot(snapshot).errors);
}

export function validateKalshiMarketSnapshot(snapshot) {
  const errors = [];

  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return { ok: false, errors: ["KalshiMarketSnapshot must be a JSON object"] };
  }

  // Field whitelist
  const unknownErrors = [];
  validateNoUnknownFields(unknownErrors, snapshot, requiredFields, "KalshiMarketSnapshot");
  for (const e of unknownErrors) errors.push(`${e.reason_code}: ${e.message}`);

  for (const field of requiredFields) {
    if (!Object.hasOwn(snapshot, field)) errors.push(`${field} is required`);
  }

  validateCoreFields(errors, snapshot);
  validateSafetyFlags(errors, snapshot);
  validateDeterministicId(errors, snapshot);
  validateMarketFields(errors, snapshot);
  validateIngestMetadata(errors, snapshot);
  validateForbiddenImplementationFields(errors, snapshot);
  validateForbiddenStringValues(errors, snapshot);

  return { ok: errors.length === 0, errors };
}

export function formatKalshiMarketSnapshotValidationReport(report) {
  const lines = [
    "Overlord KalshiMarketSnapshot Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`,
  ];
  for (const error of report.errors) lines.push(`ERROR ${error}`);
  return lines.join("\n");
}

function validateCoreFields(errors, snap) {
  if (snap.schema_version !== "kalshi_market_snapshot.v1") {
    errors.push("schema_version must be kalshi_market_snapshot.v1");
  }
  if (Number.isNaN(Date.parse(snap.generated_at))) {
    errors.push("generated_at must be a valid ISO 8601 timestamp");
  }
  if (snap.source_system !== "kalshi") {
    errors.push("source_system must be kalshi");
  }
  if (!allowedIngestModes.has(snap.ingest_mode)) {
    errors.push(`ingest_mode must be one of: ${[...allowedIngestModes].join(", ")}`);
  }
  if (snap.adapter_contract_id !== ADAPTER_CONTRACT_ID) {
    errors.push(
      `adapter_contract_id must be ${ADAPTER_CONTRACT_ID} — the governing Phase 4L contract`
    );
  }
  if (typeof snap.source_fixture_path !== "string" || snap.source_fixture_path.length === 0) {
    errors.push("source_fixture_path must be a non-empty string");
  }
}

function validateSafetyFlags(errors, snap) {
  if (snap.paper_only !== true) errors.push("paper_only must be true");
  if (snap.live_execution_allowed !== false) errors.push("live_execution_allowed must be false");
  if (snap.order_placement_allowed !== false) errors.push("order_placement_allowed must be false");
  if (snap.credentials_used !== false) errors.push("credentials_used must be false");
  if (snap.authenticated_request_used !== false)
    errors.push("authenticated_request_used must be false — no authenticated endpoints in Phase 4M");
  if (snap.network_request_used !== false)
    errors.push("network_request_used must be false — local fixture ingest only in Phase 4M");
}

function validateDeterministicId(errors, snap) {
  if (
    typeof snap.source_system !== "string" ||
    typeof snap.market_ticker !== "string" ||
    typeof snap.ingest_mode !== "string" ||
    typeof snap.schema_version !== "string"
  ) return;

  const expected = kalshiMarketSnapshotId({
    sourceSystem: snap.source_system,
    marketTicker: snap.market_ticker,
    ingestMode: snap.ingest_mode,
    schemaVersion: snap.schema_version,
  });
  if (snap.kalshi_market_snapshot_id !== expected) {
    errors.push(
      "kalshi_market_snapshot_id must be deterministic from source_system, market_ticker, ingest_mode, schema_version"
    );
  }
}

function validateMarketFields(errors, snap) {
  if (typeof snap.market_ticker !== "string" || snap.market_ticker.length === 0) {
    errors.push("market_ticker must be a non-empty string");
  }
  if (typeof snap.event_ticker !== "string" || snap.event_ticker.length === 0) {
    errors.push("event_ticker must be a non-empty string");
  }
  if (typeof snap.title !== "string" || snap.title.length === 0) {
    errors.push("title must be a non-empty string");
  }
  if (typeof snap.market_status !== "string" || snap.market_status.length === 0) {
    errors.push("market_status must be a non-empty string");
  }
  // Price fields must be numbers 0–99 (Kalshi cents)
  for (const field of ["yes_ask_cents", "yes_bid_cents", "no_ask_cents", "no_bid_cents", "last_price_cents"]) {
    if (typeof snap[field] !== "number" || snap[field] < 0 || snap[field] > 99) {
      errors.push(`${field} must be a number between 0 and 99`);
    }
  }
  // Volume / open interest: null or non-negative integer
  for (const field of ["volume", "open_interest"]) {
    if (snap[field] !== null && (typeof snap[field] !== "number" || snap[field] < 0)) {
      errors.push(`${field} must be null or a non-negative number`);
    }
  }
}

function validateIngestMetadata(errors, snap) {
  if (!allowedDataQualityStatuses.has(snap.data_quality_status)) {
    errors.push(
      `data_quality_status must be one of: ${[...allowedDataQualityStatuses].join(", ")}`
    );
  }
  if (!Array.isArray(snap.ingest_warnings)) {
    errors.push("ingest_warnings must be an array");
  }
  if (snap.reason_code !== "INGEST_COMPLETE") {
    errors.push("reason_code must be INGEST_COMPLETE");
  }
  if (typeof snap.reason !== "string" || snap.reason.length === 0) {
    errors.push("reason must be a non-empty string");
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
      errors.push(`forbidden market snapshot field detected: ${fieldPath}`);
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
          `forbidden market snapshot string value detected at ${fieldPath}: contains "${label}"`
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
  const report = await validateKalshiMarketSnapshotFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath,
  });
  console.log(formatKalshiMarketSnapshotValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
