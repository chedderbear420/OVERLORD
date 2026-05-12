import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateKalshiMarketSnapshotFile,
  validateKalshiMarketSnapshot,
} from "../src/validate-kalshi-market-snapshot.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(
  repoRoot,
  "packages",
  "strategy-dsl",
  "fixtures",
  "synthetic_kalshi_market_snapshot.json"
);

test("synthetic KalshiMarketSnapshot fixture validates", async () => {
  const report = await validateKalshiMarketSnapshotFile({ filePath: fixturePath });
  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("KalshiMarketSnapshot validator rejects unsafe safety flags", async () => {
  const snap = await loadSnapshot();
  const result = validateKalshiMarketSnapshot({
    ...snap,
    paper_only: false,
    live_execution_allowed: true,
    order_placement_allowed: true,
  });
  assert.equal(result.ok, false);
  const joined = result.errors.join("\n");
  assert.match(joined, /paper_only must be true/);
  assert.match(joined, /live_execution_allowed must be false/);
  assert.match(joined, /order_placement_allowed must be false/);
});

test("KalshiMarketSnapshot validator rejects credential/auth/network usage", async () => {
  const snap = await loadSnapshot();

  const withCreds = validateKalshiMarketSnapshot({ ...snap, credentials_used: true });
  assert.equal(withCreds.ok, false);
  assert.match(withCreds.errors.join("\n"), /credentials_used must be false/);

  const withAuth = validateKalshiMarketSnapshot({ ...snap, authenticated_request_used: true });
  assert.equal(withAuth.ok, false);
  assert.match(withAuth.errors.join("\n"), /authenticated_request_used must be false/);

  const withNet = validateKalshiMarketSnapshot({ ...snap, network_request_used: true });
  assert.equal(withNet.ok, false);
  assert.match(withNet.errors.join("\n"), /network_request_used must be false/);
});

test("KalshiMarketSnapshot validator rejects wrong adapter_contract_id", async () => {
  const snap = await loadSnapshot();
  const result = validateKalshiMarketSnapshot({
    ...snap,
    adapter_contract_id: "krac_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /adapter_contract_id must be/);
});

test("KalshiMarketSnapshot validator rejects missing adapter_contract_id", async () => {
  const snap = await loadSnapshot();
  const { adapter_contract_id: _removed, ...snapWithout } = snap;
  const result = validateKalshiMarketSnapshot(snapWithout);
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /adapter_contract_id/);
});

test("KalshiMarketSnapshot validator rejects unknown fields", async () => {
  const snap = await loadSnapshot();
  const result = validateKalshiMarketSnapshot({ ...snap, unexpected_hook: "value" });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /ERR_UNKNOWN_FIELD/);
});

test("KalshiMarketSnapshot validator rejects order/execution/account/position fields", async () => {
  const snap = await loadSnapshot();

  const withOrder = validateKalshiMarketSnapshot({ ...snap, order: { side: "yes" } });
  assert.equal(withOrder.ok, false);
  assert.match(withOrder.errors.join("\n"), /forbidden market snapshot field/);

  const withBalance = validateKalshiMarketSnapshot({ ...snap, balance: 1000 });
  assert.equal(withBalance.ok, false);
  assert.match(withBalance.errors.join("\n"), /forbidden market snapshot field/);

  const withPosition = validateKalshiMarketSnapshot({ ...snap, position: { size: 5 } });
  assert.equal(withPosition.ok, false);
  assert.match(withPosition.errors.join("\n"), /forbidden market snapshot field/);
});

test("KalshiMarketSnapshot validator rejects signal/pick/recommendation/bankroll/edge fields", async () => {
  const snap = await loadSnapshot();

  const withSignal = validateKalshiMarketSnapshot({ ...snap, signal: "yes" });
  assert.equal(withSignal.ok, false);
  assert.match(withSignal.errors.join("\n"), /forbidden market snapshot field/);

  const withEdge = validateKalshiMarketSnapshot({ ...snap, edge: 0.07 });
  assert.equal(withEdge.ok, false);
  assert.match(withEdge.errors.join("\n"), /forbidden market snapshot field/);

  const withBankroll = validateKalshiMarketSnapshot({ ...snap, bankroll: 500 });
  assert.equal(withBankroll.ok, false);
  assert.match(withBankroll.errors.join("\n"), /forbidden market snapshot field/);
});

test("KalshiMarketSnapshot validator rejects forbidden string values in free-text fields", async () => {
  const snap = await loadSnapshot();

  // Forbidden language in reason
  const withOrderReason = validateKalshiMarketSnapshot({
    ...snap,
    reason: "ready to place orders now",
  });
  assert.equal(withOrderReason.ok, false);
  assert.match(withOrderReason.errors.join("\n"), /forbidden market snapshot string value/);

  // Forbidden language in title
  const withSignalTitle = validateKalshiMarketSnapshot({
    ...snap,
    title: "Best trading signal for this market",
  });
  assert.equal(withSignalTitle.ok, false);
  assert.match(withSignalTitle.errors.join("\n"), /forbidden market snapshot string value/);

  // Forbidden language in market_status
  const withEdgeStatus = validateKalshiMarketSnapshot({
    ...snap,
    market_status: "open for edge calculations",
  });
  assert.equal(withEdgeStatus.ok, false);
  assert.match(withEdgeStatus.errors.join("\n"), /forbidden market snapshot string value/);

  // Safe reason passes
  const safeResult = validateKalshiMarketSnapshot({ ...snap, reason: "local fixture ingested" });
  assert.equal(safeResult.ok, true);
});

test("KalshiMarketSnapshot validator rejects forbidden string values in ingest_warnings", async () => {
  const snap = await loadSnapshot();

  // Order language in a warning
  const withOrderWarning = validateKalshiMarketSnapshot({
    ...snap,
    ingest_warnings: ["ready to place orders later"],
  });
  assert.equal(withOrderWarning.ok, false);
  assert.match(withOrderWarning.errors.join("\n"), /forbidden market snapshot string value/);

  // Signal language in a warning
  const withSignalWarning = validateKalshiMarketSnapshot({
    ...snap,
    ingest_warnings: ["trading signal detected"],
  });
  assert.equal(withSignalWarning.ok, false);
  assert.match(withSignalWarning.errors.join("\n"), /forbidden market snapshot string value/);

  // Safe empty array passes
  const withEmptyWarnings = validateKalshiMarketSnapshot({ ...snap, ingest_warnings: [] });
  assert.equal(withEmptyWarnings.ok, true);
});

test("KalshiMarketSnapshot validator rejects non-deterministic ID", async () => {
  const snap = await loadSnapshot();
  const result = validateKalshiMarketSnapshot({
    ...snap,
    kalshi_market_snapshot_id: "kms_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /deterministic/);
});

async function loadSnapshot() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
