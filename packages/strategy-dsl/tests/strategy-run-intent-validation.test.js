import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateStrategyRunIntent,
  validateStrategyRunIntentFile
} from "../src/validate-strategy-run-intent.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_run_intent.json");

test("synthetic StrategyRunIntent fixture validates", async () => {
  const report = await validateStrategyRunIntentFile({ filePath: fixturePath });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("StrategyRunIntent rejects bad ids, unsafe flags, and invalid run modes", async () => {
  const intent = await loadIntent();
  const report = validateStrategyRunIntent({
    ...intent,
    strategy_run_intent_id: "bad",
    order_placement_allowed: true,
    run_mode: "execute_now"
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /strategy_run_intent_id must be deterministic/);
  assert.match(report.errors.join("\n"), /order_placement_allowed must be false/);
  assert.match(report.errors.join("\n"), /run_mode is invalid/);
});

test("StrategyRunIntent rejects execution and order request fields", async () => {
  const intent = await loadIntent();
  const report = validateStrategyRunIntent({
    ...intent,
    execution_plan: { execute: true },
    order_request: { side: "YES" }
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/);
});

async function loadIntent() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
