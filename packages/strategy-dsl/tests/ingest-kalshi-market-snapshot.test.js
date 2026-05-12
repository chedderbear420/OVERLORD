import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { ingestKalshiMarketSnapshot } from "../src/ingest-kalshi-market-snapshot.js";
import { buildKalshiMarketSnapshot, defaultRawFixture } from "../src/build-kalshi-market-snapshot.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const rawFixturePath = path.join(
  repoRoot,
  "packages",
  "strategy-dsl",
  "fixtures",
  "synthetic_kalshi_raw_market_snapshot.json"
);

test("ingest maps safe raw fixture to canonical snapshot", async () => {
  const raw = JSON.parse(await readFile(rawFixturePath, "utf8"));
  const result = ingestKalshiMarketSnapshot(raw);
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
  assert.ok(result.snapshot);
  assert.equal(result.snapshot.paper_only, true);
  assert.equal(result.snapshot.credentials_used, false);
  assert.equal(result.snapshot.network_request_used, false);
  assert.equal(result.snapshot.ingest_mode, "local_fixture_only");
  assert.match(result.snapshot.kalshi_market_snapshot_id, /^kms_[a-f0-9]{32}$/u);
});

test("ingest result deepEquals builder output", async () => {
  const raw = JSON.parse(await readFile(rawFixturePath, "utf8"));
  const result = ingestKalshiMarketSnapshot(raw);
  const built = buildKalshiMarketSnapshot(defaultRawFixture);
  assert.equal(result.ok, true);
  assert.deepEqual(result.snapshot, built);
});

test("ingest rejects forbidden raw fixture field: api_key", () => {
  const result = ingestKalshiMarketSnapshot({ ...defaultRawFixture, api_key: "sk_live_abc123" });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /forbidden field in raw Kalshi fixture: api_key/);
  assert.equal(result.snapshot, null);
});

test("ingest rejects forbidden raw fixture field: token", () => {
  const result = ingestKalshiMarketSnapshot({ ...defaultRawFixture, token: "Bearer xyz" });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /forbidden field in raw Kalshi fixture: token/);
});

test("ingest rejects forbidden raw fixture field: order", () => {
  const result = ingestKalshiMarketSnapshot({ ...defaultRawFixture, order: { side: "yes", size: 10 } });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /forbidden field in raw Kalshi fixture: order/);
});

test("ingest rejects forbidden raw fixture field: signal", () => {
  const result = ingestKalshiMarketSnapshot({ ...defaultRawFixture, signal: "strong_yes" });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /forbidden field in raw Kalshi fixture: signal/);
});

test("ingest rejects forbidden raw fixture field: balance", () => {
  const result = ingestKalshiMarketSnapshot({ ...defaultRawFixture, balance: 5000 });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /forbidden field in raw Kalshi fixture: balance/);
});

test("ingest rejects forbidden raw fixture field: portfolio", () => {
  const result = ingestKalshiMarketSnapshot({ ...defaultRawFixture, portfolio: {} });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /forbidden field in raw Kalshi fixture: portfolio/);
});

test("ingest rejects non-object raw input", () => {
  const result = ingestKalshiMarketSnapshot("not-an-object");
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /raw fixture must be a JSON object/);
});

test("ingest recursively rejects nested forbidden field: metadata.api_key", () => {
  const result = ingestKalshiMarketSnapshot({
    ...defaultRawFixture,
    metadata: { api_key: "sk_live_abc123" },
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /forbidden field in raw Kalshi fixture: metadata\.api_key/);
  assert.equal(result.snapshot, null);
});

test("ingest recursively rejects nested forbidden field: metadata.order", () => {
  const result = ingestKalshiMarketSnapshot({
    ...defaultRawFixture,
    metadata: { order: { side: "yes", size: 10 } },
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /forbidden field in raw Kalshi fixture: metadata\.order/);
});

test("ingest recursively rejects nested forbidden field: metadata.signal", () => {
  const result = ingestKalshiMarketSnapshot({
    ...defaultRawFixture,
    metadata: { signal: "strong_yes" },
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /forbidden field in raw Kalshi fixture: metadata\.signal/);
});

test("ingest recursively rejects forbidden field nested inside array", () => {
  const result = ingestKalshiMarketSnapshot({
    ...defaultRawFixture,
    context: [{ api_key: "secret" }],
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /forbidden field in raw Kalshi fixture: context\.0\.api_key/);
});

test("4M source files contain no network/HTTP client imports", async () => {
  const filesToCheck = [
    "packages/strategy-dsl/src/kalshi-market-snapshot-id.js",
    "packages/strategy-dsl/src/build-kalshi-market-snapshot.js",
    "packages/strategy-dsl/src/ingest-kalshi-market-snapshot.js",
    "packages/strategy-dsl/src/validate-kalshi-market-snapshot.js",
  ];
  const forbidden = [
    /import.*\bfetch\b/u,
    /import.*\baxios\b/u,
    /import.*node:http/u,
    /import.*node:https/u,
    /import.*\bwebsocket\b/iu,
    /require\(.*fetch/u,
    /require\(.*axios/u,
  ];
  for (const relPath of filesToCheck) {
    const fullPath = path.join(repoRoot, relPath);
    const src = await readFile(fullPath, "utf8");
    for (const pattern of forbidden) {
      assert.equal(
        pattern.test(src),
        false,
        `${relPath} must not import network client: ${pattern}`
      );
    }
  }
});
