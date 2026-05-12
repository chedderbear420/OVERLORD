import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  allowedOperationCategories,
  forbiddenOperationCategories,
  buildKalshiReadonlyAdapterContract
} from "../src/build-kalshi-readonly-adapter-contract.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_kalshi_readonly_adapter_contract.json");

test("buildKalshiReadonlyAdapterContract matches synthetic fixture", async () => {
  const contract = buildKalshiReadonlyAdapterContract();
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

  assert.deepEqual(contract, fixture);
});

test("buildKalshiReadonlyAdapterContract enforces all safety flags", () => {
  const contract = buildKalshiReadonlyAdapterContract();

  assert.equal(contract.paper_only, true);
  assert.equal(contract.live_execution_allowed, false);
  assert.equal(contract.order_placement_allowed, false);
  assert.equal(contract.credentials_allowed, false);
  assert.equal(contract.network_client_allowed, false);
  assert.equal(contract.adapter_mode, "read_only_contract_only");
  assert.equal(contract.contract_scope, "contract_definition_only");
  assert.equal(contract.status, "kalshi_readonly_adapter_contract_ready");
  assert.equal(contract.reason_code, "VALIDATION_PASSED");
});

test("buildKalshiReadonlyAdapterContract defines read-only operation boundaries", () => {
  const contract = buildKalshiReadonlyAdapterContract();

  assert.equal(contract.allowed_operation_categories.length, allowedOperationCategories.length);
  assert.equal(contract.forbidden_operation_categories.length, forbiddenOperationCategories.length);
  assert.equal(contract.allowed_operation_categories.includes("market_discovery"), true);
  assert.equal(contract.allowed_operation_categories.includes("market_metadata"), true);
  assert.equal(contract.allowed_operation_categories.includes("orderbook_snapshot_read"), true);
  assert.equal(contract.forbidden_operation_categories.includes("order_placement"), true);
  assert.equal(contract.forbidden_operation_categories.includes("credential_handling"), true);
  assert.equal(contract.forbidden_operation_categories.includes("live_execution"), true);
  assert.equal(contract.forbidden_operation_categories.includes("bankroll_sizing"), true);
  assert.equal(contract.forbidden_operation_categories.includes("signals"), true);
  assert.equal(contract.forbidden_operation_categories.includes("recommendations"), true);
});

test("buildKalshiReadonlyAdapterContract ID is deterministic from known inputs", () => {
  const a = buildKalshiReadonlyAdapterContract();
  const b = buildKalshiReadonlyAdapterContract({ generatedAt: "2099-01-01T00:00:00Z" });

  assert.equal(a.kalshi_readonly_adapter_contract_id, b.kalshi_readonly_adapter_contract_id);
  assert.match(a.kalshi_readonly_adapter_contract_id, /^krac_[a-f0-9]{32}$/u);
});
