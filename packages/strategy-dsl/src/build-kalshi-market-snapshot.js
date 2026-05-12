import { kalshiMarketSnapshotId } from "./kalshi-market-snapshot-id.js";

// The Phase 4L adapter contract that governs this ingest pipeline.
export const ADAPTER_CONTRACT_ID = "krac_8e72c258a5e00a78b7e45b50a8e4f47f";

// Default raw fixture — synthetic Kalshi-like market snapshot, no live data.
export const defaultRawFixture = {
  ticker: "NBAPLAY-25-GSW-LKR-Y",
  event_ticker: "NBAPLAY-25-GSW-LKR",
  title: "Warriors vs Lakers: Golden State Warriors win (Game 1)?",
  status: "open",
  yes_ask: 54,
  yes_bid: 52,
  no_ask: 48,
  no_bid: 46,
  last_price: 53,
  volume: 18420,
  open_interest: 9870,
  expiration_time: "2026-05-12T05:00:00Z",
  close_time: "2026-05-12T02:30:00Z",
  result: null,
  can_close_early: false,
};

/**
 * Build a canonical Kalshi market snapshot from a raw fixture object.
 * Self-contained — no file I/O, no network, no credentials.
 *
 * @param {object} rawFixture  Raw Kalshi-like market data (default: defaultRawFixture)
 * @param {object} options     { generatedAt, sourceFixturePath }
 */
export function buildKalshiMarketSnapshot(rawFixture = defaultRawFixture, options = {}) {
  const generatedAt = options.generatedAt ?? "2026-05-11T00:00:00Z";
  const sourceFixturePath =
    options.sourceFixturePath ??
    "packages/strategy-dsl/fixtures/synthetic_kalshi_raw_market_snapshot.json";

  const schemaVersion = "kalshi_market_snapshot.v1";
  const ingestMode = "local_fixture_only";
  const sourceSystem = "kalshi";

  return {
    kalshi_market_snapshot_id: kalshiMarketSnapshotId({
      sourceSystem,
      marketTicker: rawFixture.ticker,
      ingestMode,
      schemaVersion,
    }),
    schema_version: schemaVersion,
    generated_at: generatedAt,
    source_system: sourceSystem,
    source_fixture_path: sourceFixturePath,
    adapter_contract_id: ADAPTER_CONTRACT_ID,
    ingest_mode: ingestMode,

    // Safety flags — all hardcoded, never overridable by raw input
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    credentials_used: false,
    authenticated_request_used: false,
    network_request_used: false,

    // Descriptive market fields — no edge, signal, or execution data
    market_ticker: rawFixture.ticker,
    event_ticker: rawFixture.event_ticker,
    title: rawFixture.title,
    market_status: rawFixture.status,

    // Price observations (cents, 0–99). Descriptive only — not signals or EV.
    yes_ask_cents: rawFixture.yes_ask,
    yes_bid_cents: rawFixture.yes_bid,
    no_ask_cents: rawFixture.no_ask,
    no_bid_cents: rawFixture.no_bid,
    last_price_cents: rawFixture.last_price,

    // Volume / liquidity metadata
    volume: rawFixture.volume ?? null,
    open_interest: rawFixture.open_interest ?? null,

    // Timing metadata
    expiration_time: rawFixture.expiration_time ?? null,
    close_time: rawFixture.close_time ?? null,

    // Settlement metadata
    result: rawFixture.result ?? null,
    can_close_early: rawFixture.can_close_early ?? false,

    // Ingest metadata
    data_quality_status: "complete",
    ingest_warnings: [],
    reason_code: "INGEST_COMPLETE",
    reason: "local fixture ingested successfully",
  };
}
