import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateStrategyObservationProcessingNoopSummaryFile,
  validateStrategyObservationProcessingNoopSummary
} from "../src/validate-strategy-observation-processing-noop-summary.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_processing_noop_summary.json");

test("synthetic StrategyObservationProcessingNoopSummary fixture validates", async () => {
  const report = await validateStrategyObservationProcessingNoopSummaryFile({ filePath: fixturePath });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("StrategyObservationProcessingNoopSummary validator rejects unsafe flags", async () => {
  const summary = await loadSummary();
  const result = validateStrategyObservationProcessingNoopSummary({
    ...summary,
    paper_only: false,
    live_execution_allowed: true,
    order_placement_allowed: true
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /paper_only must be true/);
  assert.match(result.errors.join("\n"), /live_execution_allowed must be false/);
  assert.match(result.errors.join("\n"), /order_placement_allowed must be false/);
});

test("StrategyObservationProcessingNoopSummary validator rejects mismatched totals", async () => {
  const summary = await loadSummary();
  const result = validateStrategyObservationProcessingNoopSummary({
    ...summary,
    total_trace_records: 5,
    total_inputs_observed: 7
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /total_trace_records must equal total_inputs_observed plus start and completed/);
});

test("StrategyObservationProcessingNoopSummary validator rejects non-deterministic id", async () => {
  const summary = await loadSummary();
  const result = validateStrategyObservationProcessingNoopSummary({
    ...summary,
    strategy_observation_processing_noop_summary_id: "sopns_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /strategy_observation_processing_noop_summary_id must be deterministic/);
});

test("StrategyObservationProcessingNoopSummary validator rejects forbidden fields", async () => {
  const summary = await loadSummary();
  const result = validateStrategyObservationProcessingNoopSummary({
    ...summary,
    order: { qty: 1 }
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/);
});

async function loadSummary() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
