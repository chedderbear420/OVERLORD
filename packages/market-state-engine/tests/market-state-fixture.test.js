import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildMarketStatesFromEventFixture, readMarketStateJsonl } from "../src/market-state-reader.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const eventFixturePath = path.join(repoRoot, "packages", "event-store", "fixtures", "synthetic_market_events.jsonl");
const marketStateFixturePath = path.join(
  repoRoot,
  "packages",
  "market-state-engine",
  "fixtures",
  "synthetic_market_states.jsonl"
);

test("synthetic MarketState fixture matches generated states", async () => {
  const generated = await buildMarketStatesFromEventFixture(eventFixturePath);
  const fixtureStates = await readMarketStateJsonl(marketStateFixturePath);

  assert.deepEqual(fixtureStates, generated.states);
  assert.equal(generated.skipped.length, 2);
});

test("synthetic MarketState fixture is replay-ready JSONL in source event order", async () => {
  const states = await readMarketStateJsonl(marketStateFixturePath);

  assert.deepEqual(states.map((state) => state.state_id), ["ms_evt_synth_000002", "ms_evt_synth_000003"]);
  assert.deepEqual(states.map((state) => state.source_event_id), ["evt_synth_000002", "evt_synth_000003"]);
  assert.deepEqual(states.map((state) => state.price_unit), ["cents", "cents"]);
});
