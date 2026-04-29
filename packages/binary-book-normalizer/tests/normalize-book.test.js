import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { normalizeBinaryOrderBook } from "../src/normalize-book.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "binary-book-normalizer", "fixtures", "synthetic_orderbooks.json");

test("normalizes synthetic YES/NO bid book into implied asks and spreads", async () => {
  const fixtures = await loadFixtures();
  const fixture = fixtures.find((item) => item.name === "balanced_liquid");
  const normalized = normalizeBinaryOrderBook(fixture.book);

  assert.equal(normalized.price_unit, "cents");
  assert.equal(normalized.best_yes_bid, 48);
  assert.equal(normalized.best_yes_ask, 51);
  assert.equal(normalized.best_no_bid, 49);
  assert.equal(normalized.best_no_ask, 52);
  assert.equal(normalized.yes_spread, 3);
  assert.equal(normalized.no_spread, 3);
  assert.equal(normalized.yes_mid, 49.5);
  assert.equal(normalized.no_mid, 50.5);
  assert.equal(normalized.yes_depth, 200);
  assert.equal(normalized.no_depth, 200);
  assert.equal(normalized.book_imbalance, 0);
  assert.equal(normalized.liquidity_status, "liquid");
  assert.equal(normalized.staleness_status, "fresh");
  assert.deepEqual(normalized.quality_flags, []);
});

test("does not mutate input fixtures", async () => {
  const fixtures = await loadFixtures();
  const fixture = fixtures.find((item) => item.name === "balanced_liquid");
  const before = JSON.stringify(fixture.book);

  normalizeBinaryOrderBook(fixture.book);

  assert.equal(JSON.stringify(fixture.book), before);
});

test("handles empty side books deterministically", async () => {
  const fixtures = await loadFixtures();
  const fixture = fixtures.find((item) => item.name === "empty_sides");
  const normalized = normalizeBinaryOrderBook(fixture.book);

  assert.equal(normalized.best_yes_bid, null);
  assert.equal(normalized.best_yes_ask, null);
  assert.equal(normalized.best_no_bid, null);
  assert.equal(normalized.best_no_ask, null);
  assert.equal(normalized.yes_spread, null);
  assert.equal(normalized.no_spread, null);
  assert.equal(normalized.yes_mid, null);
  assert.equal(normalized.no_mid, null);
  assert.equal(normalized.yes_depth, 0);
  assert.equal(normalized.no_depth, 0);
  assert.equal(normalized.book_imbalance, null);
  assert.equal(normalized.liquidity_status, "empty");
  assert.deepEqual(normalized.quality_flags, ["empty_no_bids", "empty_yes_bids"]);
});

test("flags crossed binary books as invalid", async () => {
  const fixtures = await loadFixtures();
  const fixture = fixtures.find((item) => item.name === "crossed_book");
  const normalized = normalizeBinaryOrderBook(fixture.book);

  assert.equal(normalized.best_yes_bid, 62);
  assert.equal(normalized.best_yes_ask, 55);
  assert.equal(normalized.yes_spread, -7);
  assert.equal(normalized.no_spread, -7);
  assert.equal(normalized.liquidity_status, "invalid");
  assert.deepEqual(normalized.quality_flags, ["crossed_book"]);
});

test("flags invalid price and quantity fields deterministically", () => {
  const normalized = normalizeBinaryOrderBook({
    market_id: "SYNTH-BAD",
    source_event_id: "evt_synth_bad",
    captured_at: "2026-04-28T14:00:00Z",
    received_at: "2026-04-28T14:00:01Z",
    yes_bids: [{ price_cents: 101, quantity: 1 }],
    no_bids: [{ price_cents: 50, quantity: -1 }]
  });

  assert.equal(normalized.liquidity_status, "invalid");
  assert.equal(normalized.staleness_status, "fresh");
  assert.deepEqual(normalized.quality_flags, ["crossed_book", "invalid_price", "invalid_quantity"]);
});

test("classifies stale thin books without treating them as trade decisions", async () => {
  const fixtures = await loadFixtures();
  const fixture = fixtures.find((item) => item.name === "stale_thin");
  const normalized = normalizeBinaryOrderBook(fixture.book);

  assert.equal(normalized.liquidity_status, "thin");
  assert.equal(normalized.staleness_status, "stale");
  assert.deepEqual(normalized.quality_flags, ["stale"]);
});

async function loadFixtures() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
