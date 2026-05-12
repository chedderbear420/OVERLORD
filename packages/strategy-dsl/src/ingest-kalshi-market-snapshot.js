import { buildKalshiMarketSnapshot } from "./build-kalshi-market-snapshot.js";

// Fields that must never appear in a raw Kalshi fixture passed to this ingest pipeline.
// Their presence indicates execution data, credentials, or forbidden concepts.
const forbiddenRawFields = new Set([
  // Credentials / auth
  "api_key", "api_secret", "token", "bearer", "secret", "auth_token",
  "private_key", "password", "credential", "credentials",
  // Account / financial state
  "account_id", "account_balance", "balance", "portfolio",
  "position", "positions",
  // Order / execution
  "order", "orders", "order_id", "order_request", "trade_request",
  "execution", "fill", "fills",
  // Signal / decision
  "signal", "recommendation", "pick", "decision",
  "edge", "expected_value", "bankroll", "kelly_fraction", "position_size",
  // Network / client implementation
  "fetch", "axios", "http_client", "websocket", "base_url", "endpoint_url",
]);

/**
 * Ingest a raw Kalshi-like market fixture object into a canonical snapshot.
 *
 * Contract:
 * - No network requests made.
 * - No environment variables read.
 * - No credentials accepted or forwarded.
 * - Raw input validated for forbidden fields before mapping.
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

  // Reject any forbidden field present in the raw input
  for (const key of Object.keys(rawFixture)) {
    if (forbiddenRawFields.has(key)) {
      errors.push(`forbidden field in raw Kalshi fixture: ${key}`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors, snapshot: null };
  }

  // Map to canonical shape via builder — safety flags are hardcoded in builder,
  // not propagated from raw input.
  const snapshot = buildKalshiMarketSnapshot(rawFixture, options);
  return { ok: true, errors: [], snapshot };
}
