import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { readJsonl } from "../../event-store/src/jsonl.js";
import { normalizeBinaryOrderBook } from "../../binary-book-normalizer/src/normalize-book.js";
import { buildMarketStateFromEnvelope, buildMarketStatesFromEnvelopes } from "../src/build-market-state.js";
import { marketStateId } from "../src/market-state-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const eventFixturePath = path.join(repoRoot, "packages", "event-store", "fixtures", "synthetic_market_events.jsonl");

test("buildMarketStatesFromEnvelopes selects only order book market events", async () => {
  const envelopes = await loadEventEnvelopes();
  const { states, skipped } = buildMarketStatesFromEnvelopes(envelopes);

  assert.equal(states.length, 2);
  assert.deepEqual(states.map((state) => state.source_event_id), ["evt_synth_000002", "evt_synth_000003"]);
  assert.deepEqual(skipped, [
    { event_id: "evt_synth_000001", reason: "no_orderbook_payload" },
    { event_id: "evt_synth_000004", reason: "not_market_event" }
  ]);
});

test("MarketState preserves source envelope provenance", async () => {
  const envelopes = await loadEventEnvelopes();
  const envelope = envelopes.find((item) => item.event_id === "evt_synth_000002");
  const state = buildMarketStateFromEnvelope(envelope);

  assert.equal(state.state_id, "ms_evt_synth_000002");
  assert.equal(state.schema_version, "market_state.v1");
  assert.equal(state.source_event_id, envelope.event_id);
  assert.equal(state.source_payload_hash, envelope.payload_hash);
  assert.equal(state.source, envelope.source);
  assert.equal(state.market_id, envelope.payload.market_id);
  assert.equal(state.captured_at, envelope.payload.captured_at);
  assert.equal(state.received_at, envelope.payload.received_at);
});

test("MarketState normalization matches binary-book-normalizer output", async () => {
  const envelopes = await loadEventEnvelopes();
  const envelope = envelopes.find((item) => item.event_id === "evt_synth_000003");
  const state = buildMarketStateFromEnvelope(envelope);
  const normalized = normalizeBinaryOrderBook({
    market_id: envelope.payload.market_id,
    source_event_id: envelope.event_id,
    captured_at: envelope.payload.captured_at,
    received_at: envelope.payload.received_at,
    yes_bids: envelope.payload.orderbook.yes_bids,
    no_bids: envelope.payload.orderbook.no_bids
  });

  for (const field of [
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
  ]) {
    assert.deepEqual(state[field], normalized[field]);
  }
});

test("marketStateId is deterministic and safe", () => {
  assert.equal(marketStateId("evt_synth_000002"), "ms_evt_synth_000002");
  assert.equal(marketStateId("evt bad id"), "ms_evt_bad_id");
});

test("buildMarketStateFromEnvelope does not mutate source envelope", async () => {
  const envelopes = await loadEventEnvelopes();
  const envelope = envelopes.find((item) => item.event_id === "evt_synth_000002");
  const before = JSON.stringify(envelope);

  buildMarketStateFromEnvelope(envelope);

  assert.equal(JSON.stringify(envelope), before);
});

async function loadEventEnvelopes() {
  const records = await readJsonl(eventFixturePath);
  return records.map((record) => record.value);
}
