import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  buildKalshiStrategySignalDefinition,
  defaultDefinitionOptions,
} from "../src/build-kalshi-strategy-signal-definition.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(
  repoRoot,
  "packages",
  "strategy-dsl",
  "fixtures",
  "synthetic_kalshi_strategy_signal_definition.json"
);

test("buildKalshiStrategySignalDefinition matches synthetic fixture", async () => {
  const built = buildKalshiStrategySignalDefinition();
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
  assert.deepEqual(built, fixture);
});

test("ID is deterministic and has kssd_ prefix", () => {
  const a = buildKalshiStrategySignalDefinition();
  const b = buildKalshiStrategySignalDefinition({ generatedAt: "2099-01-01T00:00:00Z" });
  assert.equal(a.kalshi_strategy_signal_definition_id, b.kalshi_strategy_signal_definition_id);
  assert.match(a.kalshi_strategy_signal_definition_id, /^kssd_[a-f0-9]{32}$/u);
});

test("buildKalshiStrategySignalDefinition enforces all safety flags", () => {
  const def = buildKalshiStrategySignalDefinition();
  assert.equal(def.paper_only, true);
  assert.equal(def.live_execution_allowed, false);
  assert.equal(def.order_placement_allowed, false);
  assert.equal(def.credentials_used, false);
  assert.equal(def.network_request_used, false);
  assert.equal(def.evaluation_allowed, false);
  assert.equal(def.reason_code, "DEFINITION_CONTRACT_READY");
});

test("buildKalshiStrategySignalDefinition source artifact fields are correct", () => {
  const def = buildKalshiStrategySignalDefinition();
  assert.equal(def.source_artifact_type, "kalshi_market_snapshot");
  assert.equal(def.source_schema_version, "kalshi_market_snapshot.v1");
  assert.equal(def.source_phase, "Phase 4M");
  assert.equal(def.definition_mode, "definition_only");
});

test("buildKalshiStrategySignalDefinition output_contract emits nothing", () => {
  const def = buildKalshiStrategySignalDefinition();
  assert.equal(def.output_contract.emits_signal_events, false);
  assert.equal(def.output_contract.emits_recommendations, false);
  assert.equal(def.output_contract.emits_decisions, false);
  assert.equal(def.output_contract.emits_orders, false);
  assert.equal(def.output_contract.emits_paper_ledger_entries, false);
  assert.equal(def.output_contract.evaluation_phase_required, "Phase 4O");
});
