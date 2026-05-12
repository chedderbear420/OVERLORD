import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateKalshiReadonlyAdapterContractFile,
  validateKalshiReadonlyAdapterContract
} from "../src/validate-kalshi-readonly-adapter-contract.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_kalshi_readonly_adapter_contract.json");

test("synthetic KalshiReadonlyAdapterContract fixture validates", async () => {
  const report = await validateKalshiReadonlyAdapterContractFile({ filePath: fixturePath });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("KalshiReadonlyAdapterContract validator rejects unsafe safety flags", async () => {
  const contract = await loadContract();
  const result = validateKalshiReadonlyAdapterContract({
    ...contract,
    paper_only: false,
    live_execution_allowed: true,
    order_placement_allowed: true,
    credentials_allowed: true,
    network_client_allowed: true
  });

  assert.equal(result.ok, false);
  const joined = result.errors.join("\n");
  assert.match(joined, /paper_only must be true/);
  assert.match(joined, /live_execution_allowed must be false/);
  assert.match(joined, /order_placement_allowed must be false/);
  assert.match(joined, /credentials_allowed must be false/);
  assert.match(joined, /network_client_allowed must be false/);
});

test("KalshiReadonlyAdapterContract validator rejects forbidden operation in allowed list", async () => {
  const contract = await loadContract();
  const result = validateKalshiReadonlyAdapterContract({
    ...contract,
    allowed_operation_categories: ["market_discovery", "order_placement"],
    kalshi_readonly_adapter_contract_id: contract.kalshi_readonly_adapter_contract_id
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /forbidden category/);
});

test("KalshiReadonlyAdapterContract validator rejects non-deterministic id", async () => {
  const contract = await loadContract();
  const result = validateKalshiReadonlyAdapterContract({
    ...contract,
    kalshi_readonly_adapter_contract_id: "krac_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /must be deterministic/);
});

test("KalshiReadonlyAdapterContract validator rejects forbidden implementation fields", async () => {
  const contract = await loadContract();
  const withApiKey = validateKalshiReadonlyAdapterContract({ ...contract, api_key: "abc123" });
  const withFetch = validateKalshiReadonlyAdapterContract({ ...contract, fetch: { base_url: "https://example.com" } });
  const withWebsocket = validateKalshiReadonlyAdapterContract({ ...contract, websocket: { url: "wss://example.com" } });
  const withSignal = validateKalshiReadonlyAdapterContract({ ...contract, signal: { direction: "yes" } });
  const withBankroll = validateKalshiReadonlyAdapterContract({ ...contract, bankroll: { amount: 100 } });

  assert.equal(withApiKey.ok, false);
  assert.match(withApiKey.errors.join("\n"), /forbidden adapter implementation field/);
  assert.equal(withFetch.ok, false);
  assert.match(withFetch.errors.join("\n"), /forbidden adapter implementation field/);
  assert.equal(withWebsocket.ok, false);
  assert.match(withWebsocket.errors.join("\n"), /forbidden adapter implementation field/);
  assert.equal(withSignal.ok, false);
  assert.match(withSignal.errors.join("\n"), /forbidden adapter implementation field/);
  assert.equal(withBankroll.ok, false);
  assert.match(withBankroll.errors.join("\n"), /forbidden adapter implementation field/);
});

test("KalshiReadonlyAdapterContract validator rejects missing required forbidden categories", async () => {
  const contract = await loadContract();
  const result = validateKalshiReadonlyAdapterContract({
    ...contract,
    forbidden_operation_categories: ["order_placement"]
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /forbidden_operation_categories must include/);
});

test("KalshiReadonlyAdapterContract validator rejects unknown fields", async () => {
  const contract = await loadContract();
  const result = validateKalshiReadonlyAdapterContract({
    ...contract,
    unexpected_implementation_hook: "some_value"
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /ERR_UNKNOWN_FIELD/);
});

test("KalshiReadonlyAdapterContract validator rejects forbidden string values in reason", async () => {
  const contract = await loadContract();

  // "orders" triggers the order pattern
  const withOrders = validateKalshiReadonlyAdapterContract({ ...contract, reason: "ready to place orders later" });
  assert.equal(withOrders.ok, false);
  assert.match(withOrders.errors.join("\n"), /forbidden adapter contract string value/);

  // "api key" triggers the api key pattern
  const withApiKey = validateKalshiReadonlyAdapterContract({ ...contract, reason: "requires api key later" });
  assert.equal(withApiKey.ok, false);
  assert.match(withApiKey.errors.join("\n"), /forbidden adapter contract string value/);

  // "trading signal" triggers two patterns — at least one fires
  const withSignal = validateKalshiReadonlyAdapterContract({ ...contract, reason: "generates trading signal" });
  assert.equal(withSignal.ok, false);
  assert.match(withSignal.errors.join("\n"), /forbidden adapter contract string value/);

  // safe phrase: no forbidden words
  const safe = validateKalshiReadonlyAdapterContract({ ...contract, reason: "contract definition ready" });
  assert.equal(safe.ok, true);
  assert.deepEqual(safe.errors, []);
});

test("KalshiReadonlyAdapterContract validator rejects forbidden string values in other free-text fields", async () => {
  const contract = await loadContract();

  // adapter_version must include "contract-only" (core check) AND must not contain forbidden words
  const withTradingVersion = validateKalshiReadonlyAdapterContract({
    ...contract,
    adapter_version: "0.1.0-contract-only-trading-edition"
  });
  assert.equal(withTradingVersion.ok, false);
  assert.match(withTradingVersion.errors.join("\n"), /forbidden adapter contract string value/);
});

async function loadContract() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
