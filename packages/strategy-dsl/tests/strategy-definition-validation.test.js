import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateStrategyDefinition,
  validateStrategyDefinitionFile
} from "../src/validate-strategy-definition.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_definition.json");

test("synthetic StrategyDefinition fixture validates", async () => {
  const report = await validateStrategyDefinitionFile({ filePath: fixturePath });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("StrategyDefinition rejects bad ids, unsafe flags, and invalid inputs", async () => {
  const definition = await loadDefinition();
  const report = validateStrategyDefinition({
    ...definition,
    strategy_definition_id: "bad",
    live_execution_allowed: true,
    allowed_inputs: ["market_state", "live_market_feed"]
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /strategy_definition_id must be deterministic/);
  assert.match(report.errors.join("\n"), /live_execution_allowed must be false/);
  assert.match(report.errors.join("\n"), /allowed_inputs may reference existing artifact categories only/);
});

test("StrategyDefinition rejects executable fields and missing forbidden outputs", async () => {
  const definition = await loadDefinition();
  const report = validateStrategyDefinition({
    ...definition,
    handler: "runStrategy",
    forbidden_outputs: ["live_order"]
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/);
  assert.match(report.errors.join("\n"), /forbidden_outputs must include all required/);
});

async function loadDefinition() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
