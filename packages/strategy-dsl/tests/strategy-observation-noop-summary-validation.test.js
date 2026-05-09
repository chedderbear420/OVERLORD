import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateStrategyObservationNoOpSummary,
  validateStrategyObservationNoOpSummaryFile
} from "../src/validate-strategy-observation-noop-summary.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_noop_summary.json");

test("synthetic StrategyObservationNoOpSummary fixture validates", async () => {
  const report = await validateStrategyObservationNoOpSummaryFile({ filePath: fixturePath });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("StrategyObservationNoOpSummary validator rejects unsafe flags, bad ids, and bad totals", async () => {
  const summary = await loadSummary();
  const report = validateStrategyObservationNoOpSummary({
    ...summary,
    strategy_observation_noop_summary_id: "bad",
    order_placement_allowed: true,
    total_trace_records: 99
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /strategy_observation_noop_summary_id must be deterministic/);
  assert.match(report.errors.join("\n"), /order_placement_allowed must be false/);
  assert.match(report.errors.join("\n"), /total_trace_records must equal total_inputs_observed/);
});

test("StrategyObservationNoOpSummary validator rejects forbidden fields", async () => {
  const summary = await loadSummary();
  const report = validateStrategyObservationNoOpSummary({
    ...summary,
    analytics: { status: "blocked" }
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/);
});

async function loadSummary() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
