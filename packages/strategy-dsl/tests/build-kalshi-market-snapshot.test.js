import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  buildKalshiMarketSnapshot,
  defaultRawFixture,
  ADAPTER_CONTRACT_ID,
} from "../src/build-kalshi-market-snapshot.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(
  repoRoot,
  "packages",
  "strategy-dsl",
  "fixtures",
  "synthetic_kalshi_market_snapshot.json"
);

test("buildKalshiMarketSnapshot matches synthetic fixture", async () => {
  const built = buildKalshiMarketSnapshot();
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
  assert.deepEqual(built, fixture);
});

test("buildKalshiMarketSnapshot enforces all safety flags", () => {
  const snap = buildKalshiMarketSnapshot();
  assert.equal(snap.paper_only, true);
  assert.equal(snap.live_execution_allowed, false);
  assert.equal(snap.order_placement_allowed, false);
  assert.equal(snap.credentials_used, false);
  assert.equal(snap.authenticated_request_used, false);
  assert.equal(snap.network_request_used, false);
  assert.equal(snap.ingest_mode, "local_fixture_only");
  assert.equal(snap.source_system, "kalshi");
});

test("buildKalshiMarketSnapshot ID is deterministic and has kms_ prefix", () => {
  const a = buildKalshiMarketSnapshot();
  const b = buildKalshiMarketSnapshot(defaultRawFixture, { generatedAt: "2099-01-01T00:00:00Z" });
  assert.equal(a.kalshi_market_snapshot_id, b.kalshi_market_snapshot_id);
  assert.match(a.kalshi_market_snapshot_id, /^kms_[a-f0-9]{32}$/u);
});

test("buildKalshiMarketSnapshot references the Phase 4L adapter contract", () => {
  const snap = buildKalshiMarketSnapshot();
  assert.equal(snap.adapter_contract_id, ADAPTER_CONTRACT_ID);
  assert.match(snap.adapter_contract_id, /^krac_[a-f0-9]{32}$/u);
});

test("buildKalshiMarketSnapshot contains only descriptive market fields — no execution data", () => {
  const snap = buildKalshiMarketSnapshot();
  const forbidden = [
    "signal", "recommendation", "pick", "decision",
    "edge", "expected_value", "bankroll", "kelly_fraction", "position_size",
    "order", "order_id", "trade", "execution",
    "account_id", "balance", "portfolio", "position",
    "api_key", "token", "credential",
    "fetch", "axios", "websocket",
  ];
  for (const key of forbidden) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(snap, key),
      false,
      `snapshot must not contain forbidden field: ${key}`
    );
  }
});
