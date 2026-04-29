import { normalizeBinaryOrderBook } from "../../binary-book-normalizer/src/normalize-book.js";
import { marketStateId } from "./market-state-id.js";

export function buildMarketStateFromEnvelope(envelope, options = {}) {
  if (!isOrderBookMarketEventEnvelope(envelope)) {
    return null;
  }

  const payload = envelope.payload;
  const normalized = normalizeBinaryOrderBook({
    market_id: payload.market_id,
    source_event_id: envelope.event_id,
    captured_at: payload.captured_at,
    received_at: payload.received_at,
    yes_bids: payload.orderbook.yes_bids,
    no_bids: payload.orderbook.no_bids
  }, options);

  return {
    state_id: marketStateId(envelope.event_id),
    schema_version: "market_state.v1",
    source_event_id: envelope.event_id,
    source_payload_hash: envelope.payload_hash,
    source: envelope.source,
    market_id: payload.market_id,
    captured_at: payload.captured_at,
    received_at: payload.received_at,
    price_unit: normalized.price_unit,
    best_yes_bid: normalized.best_yes_bid,
    best_yes_ask: normalized.best_yes_ask,
    best_no_bid: normalized.best_no_bid,
    best_no_ask: normalized.best_no_ask,
    yes_spread: normalized.yes_spread,
    no_spread: normalized.no_spread,
    yes_mid: normalized.yes_mid,
    no_mid: normalized.no_mid,
    yes_depth: normalized.yes_depth,
    no_depth: normalized.no_depth,
    book_imbalance: normalized.book_imbalance,
    liquidity_status: normalized.liquidity_status,
    staleness_status: normalized.staleness_status,
    quality_flags: normalized.quality_flags
  };
}

export function buildMarketStatesFromEnvelopes(envelopes, options = {}) {
  const states = [];
  const skipped = [];

  for (const envelope of envelopes) {
    const state = buildMarketStateFromEnvelope(envelope, options);
    if (state === null) {
      skipped.push({
        event_id: envelope.event_id,
        reason: skipReason(envelope)
      });
      continue;
    }

    states.push(state);
  }

  return { states, skipped };
}

export function isOrderBookMarketEventEnvelope(envelope) {
  return envelope?.event_type === "market_event" &&
    envelope?.payload_schema === "market_event.v1" &&
    envelope?.payload?.orderbook &&
    Array.isArray(envelope.payload.orderbook.yes_bids) &&
    Array.isArray(envelope.payload.orderbook.no_bids);
}

function skipReason(envelope) {
  if (envelope?.event_type !== "market_event") {
    return "not_market_event";
  }

  if (envelope?.payload_schema !== "market_event.v1") {
    return "not_market_event_v1";
  }

  return "no_orderbook_payload";
}
