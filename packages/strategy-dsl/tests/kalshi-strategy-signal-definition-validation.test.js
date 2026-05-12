import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateKalshiStrategySignalDefinition,
  validateKalshiStrategySignalDefinitionFile,
} from "../src/validate-kalshi-strategy-signal-definition.js";
import { buildKalshiStrategySignalDefinition } from "../src/build-kalshi-strategy-signal-definition.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(
  repoRoot,
  "packages",
  "strategy-dsl",
  "fixtures",
  "synthetic_kalshi_strategy_signal_definition.json"
);

async function loadFixture() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}

// 1. Synthetic fixture validates
test("synthetic KalshiStrategySignalDefinition fixture validates", async () => {
  const report = await validateKalshiStrategySignalDefinitionFile({ filePath: fixturePath });
  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

// 2. Unknown fields fail
test("unknown fields are rejected", async () => {
  const def = await loadFixture();
  const result = validateKalshiStrategySignalDefinition({ ...def, unexpected_hook: "value" });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /ERR_UNKNOWN_FIELD/);
});

// 3. Non-deterministic ID fails
test("non-deterministic ID is rejected", async () => {
  const def = await loadFixture();
  const result = validateKalshiStrategySignalDefinition({
    ...def,
    kalshi_strategy_signal_definition_id: "kssd_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /deterministic/);
});

// 4. Wrong source_artifact_type fails
test("wrong source_artifact_type is rejected", async () => {
  const def = await loadFixture();
  const result = validateKalshiStrategySignalDefinition({
    ...def,
    source_artifact_type: "some_other_type",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /source_artifact_type must be kalshi_market_snapshot/);
});

// 5. Wrong source_schema_version fails
test("wrong source_schema_version is rejected", async () => {
  const def = await loadFixture();
  const result = validateKalshiStrategySignalDefinition({
    ...def,
    source_schema_version: "kalshi_market_snapshot.v2",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /source_schema_version must be kalshi_market_snapshot\.v1/);
});

// 6. evaluation_allowed true fails
test("evaluation_allowed true is rejected", async () => {
  const def = await loadFixture();
  const result = validateKalshiStrategySignalDefinition({ ...def, evaluation_allowed: true });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /evaluation_allowed must be false/);
});

// 7. paper_only false fails
test("paper_only false is rejected", async () => {
  const def = await loadFixture();
  const result = validateKalshiStrategySignalDefinition({ ...def, paper_only: false });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /paper_only must be true/);
});

// 8. live_execution_allowed true fails
test("live_execution_allowed true is rejected", async () => {
  const def = await loadFixture();
  const result = validateKalshiStrategySignalDefinition({ ...def, live_execution_allowed: true });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /live_execution_allowed must be false/);
});

// 9. order_placement_allowed true fails
test("order_placement_allowed true is rejected", async () => {
  const def = await loadFixture();
  const result = validateKalshiStrategySignalDefinition({ ...def, order_placement_allowed: true });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /order_placement_allowed must be false/);
});

// 10. credentials_used true fails
test("credentials_used true is rejected", async () => {
  const def = await loadFixture();
  const result = validateKalshiStrategySignalDefinition({ ...def, credentials_used: true });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /credentials_used must be false/);
});

// 11. network_request_used true fails
test("network_request_used true is rejected", async () => {
  const def = await loadFixture();
  const result = validateKalshiStrategySignalDefinition({ ...def, network_request_used: true });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /network_request_used must be false/);
});

// 12. output_contract.emits_signal_events true fails
test("output_contract.emits_signal_events true is rejected", async () => {
  const def = await loadFixture();
  const result = validateKalshiStrategySignalDefinition({
    ...def,
    output_contract: { ...def.output_contract, emits_signal_events: true },
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /emits_signal_events must be false/);
});

// 13. output_contract.emits_recommendations true fails
test("output_contract.emits_recommendations true is rejected", async () => {
  const def = await loadFixture();
  const result = validateKalshiStrategySignalDefinition({
    ...def,
    output_contract: { ...def.output_contract, emits_recommendations: true },
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /emits_recommendations must be false/);
});

// 14. output_contract.emits_decisions true fails
test("output_contract.emits_decisions true is rejected", async () => {
  const def = await loadFixture();
  const result = validateKalshiStrategySignalDefinition({
    ...def,
    output_contract: { ...def.output_contract, emits_decisions: true },
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /emits_decisions must be false/);
});

// 15. output_contract.emits_orders true fails
test("output_contract.emits_orders true is rejected", async () => {
  const def = await loadFixture();
  const result = validateKalshiStrategySignalDefinition({
    ...def,
    output_contract: { ...def.output_contract, emits_orders: true },
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /emits_orders must be false/);
});

// 16. output_contract.emits_paper_ledger_entries true fails
test("output_contract.emits_paper_ledger_entries true is rejected", async () => {
  const def = await loadFixture();
  const result = validateKalshiStrategySignalDefinition({
    ...def,
    output_contract: { ...def.output_contract, emits_paper_ledger_entries: true },
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /emits_paper_ledger_entries must be false/);
});

// 17. Unsafe allowed_input_fields fail
test("unsafe allowed_input_fields are rejected", async () => {
  const def = await loadFixture();
  const result = validateKalshiStrategySignalDefinition({
    ...def,
    allowed_input_fields: [...def.allowed_input_fields, "account_balance"],
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /unapproved field/);
});

// 18. Unsafe threshold names fail
test("unsafe threshold names are rejected", async () => {
  const def = await loadFixture();
  const result = validateKalshiStrategySignalDefinition({
    ...def,
    threshold_definitions: [
      ...def.threshold_definitions,
      { threshold_name: "edge_threshold", value_type: "number", comparison: "gte", required_for_evaluation: false },
    ],
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /not approved/);
});

// 19. Missing required forbidden_outputs entry fails
test("missing required forbidden_outputs entry is rejected", async () => {
  const def = await loadFixture();
  const result = validateKalshiStrategySignalDefinition({
    ...def,
    forbidden_outputs: def.forbidden_outputs.filter((o) => o !== "signal_event"),
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /forbidden_outputs must include "signal_event"/);
});

// 20. Forbidden field names recursively fail
test("forbidden field names are recursively rejected", async () => {
  const def = await loadFixture();
  const withOrder = validateKalshiStrategySignalDefinition({ ...def, order: { side: "yes" } });
  assert.equal(withOrder.ok, false);
  assert.match(withOrder.errors.join("\n"), /forbidden signal definition field/);

  const withNested = validateKalshiStrategySignalDefinition({
    ...def,
    metadata: { api_key: "secret" },
  });
  assert.equal(withNested.ok, false);
  assert.match(withNested.errors.join("\n"), /forbidden signal definition field/);
});

// 21. reason "generate trading signal" fails
test('reason "generate trading signal" is rejected', async () => {
  const def = await loadFixture();
  const result = validateKalshiStrategySignalDefinition({
    ...def,
    reason: "generate trading signal for this market",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /forbidden signal definition string value/);
});

// 22. reason "buy recommendation" fails
test('reason "buy recommendation" is rejected', async () => {
  const def = await loadFixture();
  const result = validateKalshiStrategySignalDefinition({
    ...def,
    reason: "buy recommendation ready",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /forbidden signal definition string value/);
});

// 23. reason "place order" fails
test('reason "place order" is rejected', async () => {
  const def = await loadFixture();
  const result = validateKalshiStrategySignalDefinition({
    ...def,
    reason: "ready to place order",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /forbidden signal definition string value/);
});

// 24. reason "expected value edge" fails
test('reason "expected value edge" is rejected', async () => {
  const def = await loadFixture();
  const result = validateKalshiStrategySignalDefinition({
    ...def,
    reason: "compute expected value edge for this definition",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /forbidden signal definition string value/);
});

// 25. Safe signal_definition naming in approved structural fields passes
test("safe signal_definition naming in structural fields passes", () => {
  const def = buildKalshiStrategySignalDefinition();
  // definition_name containing _condition_definition is approved structural naming
  assert.match(def.definition_name, /_condition_definition$/u);
  // ID has kssd_ prefix (strategy signal definition)
  assert.match(def.kalshi_strategy_signal_definition_id, /^kssd_/u);
  // safe reason passes
  const result = validateKalshiStrategySignalDefinition({ ...def, reason: "definition contract ready" });
  assert.equal(result.ok, true);
});
