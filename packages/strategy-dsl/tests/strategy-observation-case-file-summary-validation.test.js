import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateStrategyObservationCaseFileSummary,
  validateStrategyObservationCaseFileSummaryFile
} from "../src/validate-strategy-observation-case-file-summary.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_case_file_summary.json");

test("synthetic StrategyObservationCaseFileSummary fixture validates", async () => {
  const report = await validateStrategyObservationCaseFileSummaryFile({ filePath: fixturePath });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("StrategyObservationCaseFileSummary validator rejects unsafe flags, bad ids, and bad totals", async () => {
  const summary = await loadSummary();
  const report = validateStrategyObservationCaseFileSummary({
    ...summary,
    strategy_observation_case_file_summary_id: "bad",
    live_execution_allowed: true,
    total_trace_records: 8
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /strategy_observation_case_file_summary_id must be deterministic/);
  assert.match(report.errors.join("\n"), /live_execution_allowed must be false/);
  assert.match(report.errors.join("\n"), /total_trace_records must equal total_inputs_observed/);
});

test("StrategyObservationCaseFileSummary validator rejects status mismatches and forbidden fields", async () => {
  const summary = await loadSummary();
  const report = validateStrategyObservationCaseFileSummary({
    ...summary,
    consistency_status: "consistency_failed",
    decision_request: { status: "blocked" }
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /ready observation case-file summaries require consistency_passed/);
  assert.match(report.errors.join("\n"), /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/);
});

async function loadSummary() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
