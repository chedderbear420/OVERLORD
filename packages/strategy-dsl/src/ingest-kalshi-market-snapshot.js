import { buildKalshiMarketSnapshot } from "./build-kalshi-market-snapshot.js";

// Fields that must never appear anywhere in a raw Kalshi fixture passed to this ingest pipeline.
// Their presence (at any depth) indicates execution data, credentials, or forbidden concepts.
const forbiddenRawFields = new Set([
  // Credentials / auth
  "api_key", "api key", "api_secret", "token", "bearer", "secret", "auth_token",
  "private_key", "password", "credential", "credentials",
  // Account / financial state
  "account", "accounts", "account_id", "account_balance", "balance", "portfolio",
  "position", "positions",
  // Order / execution
  "order", "orders", "order_id", "order_request", "trade_request",
  "trade", "trades", "trading",
  "execution", "fill", "fills",
  // Signal / decision
  "signal", "signals",
  "recommendation", "recommendations",
  "pick", "picks",
  "decision", "decisions",
  "edge", "expected_value", "expected value", "bankroll", "kelly_fraction", "position_size",
  // Network / client implementation
  "fetch", "axios", "http_client", "websocket", "polling", "cron",
  "base_url", "endpoint_url",
]);

/**
 * Recursively scan a value for any key in forbiddenRawFields.
 * Reports the full dot-path of any offending key.
 */
function scanForbiddenRawFields(errors, value, pathParts = []) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, i) =>
      scanForbiddenRawFields(errors, item, [...pathParts, String(i)])
    );
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenRawFields.has(key)) {
      const fieldPath = pathParts.length > 0 ? `${pathParts.join(".")}.${key}` : key;
      errors.push(`forbidden field in raw Kalshi fixture: ${fieldPath}`);
    }
    scanForbiddenRawFields(errors, nested, [...pathParts, key]);
  }
}

/**
 * Ingest a raw Kalshi-like market fixture object into a canonical snapshot.
 *
 * Contract:
 * - No network requests made.
 * - No environment variables read.
 * - No credentials accepted or forwarded.
 * - Raw input validated recursively for forbidden fields before mapping.
 *
 * @param {object} rawFixture  Raw Kalshi-like market data object.
 * @param {object} options     Forwarded to buildKalshiMarketSnapshot: { generatedAt, sourceFixturePath }
 * @returns {{ ok: boolean, errors: string[], snapshot: object|null }}
 */
export function ingestKalshiMarketSnapshot(rawFixture, options = {}) {
  if (!rawFixture || typeof rawFixture !== "object" || Array.isArray(rawFixture)) {
    return { ok: false, errors: ["raw fixture must be a JSON object"], snapshot: null };
  }

  const errors = [];

  // Recursively reject any forbidden field at any depth of the raw input
  scanForbiddenRawFields(errors, rawFixture);

  if (errors.length > 0) {
    return { ok: false, errors, snapshot: null };
  }

  // Map to canonical shape via builder — safety flags are hardcoded in builder,
  // not propagated from raw input.
  const snapshot = buildKalshiMarketSnapshot(rawFixture, options);
  return { ok: true, errors: [], snapshot };
}
