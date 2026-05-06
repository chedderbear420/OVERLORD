import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateStrategyNoopRunSummary,
  validateStrategyNoopRunSummaryFile
} from "../src/validate-strategy-noop-run-summary.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_noop_run_summary.json");

test("synthetic StrategyNoOpRunSummary fixture validates", async () => {
  const report = await validateStrategyNoopRunSummaryFile({ filePath: fixturePath });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("StrategyNoOpRunSummary validator rejects unsafe flags, bad ids, and bad totals", async () => {
  const summary = await loadSummary();
  const report = validateStrategyNoopRunSummary({
    ...summary,
    strategy_noop_run_summary_id: "bad",
    order_placement_allowed: true,
    total_trace_records: 3
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /strategy_noop_run_summary_id must be deterministic/);
  assert.match(report.errors.join("\n"), /order_placement_allowed must be false/);
  assert.match(report.errors.join("\n"), /total_trace_records must equal total_inputs_observed plus start and completed trace records/);
});

test("StrategyNoOpRunSummary validator rejects forbidden analytics fields", async () => {
  const summary = await loadSummary();
  const report = validateStrategyNoopRunSummary({
    ...summary,
    strategy_analytics: { roi: 1 }
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/);
});

async function loadSummary() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
