import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateStrategyDryRunCaseFileSummary,
  validateStrategyDryRunCaseFileSummaryFile
} from "../src/validate-strategy-dry-run-case-file-summary.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_dry_run_case_file_summary.json");

test("synthetic StrategyDryRunCaseFileSummary fixture validates", async () => {
  const report = await validateStrategyDryRunCaseFileSummaryFile({ filePath: fixturePath });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("StrategyDryRunCaseFileSummary validator rejects unsafe flags, bad ids, and bad totals", async () => {
  const summary = await loadSummary();
  const report = validateStrategyDryRunCaseFileSummary({
    ...summary,
    strategy_dry_run_case_file_summary_id: "bad",
    live_execution_allowed: true,
    total_trace_records: 8
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /strategy_dry_run_case_file_summary_id must be deterministic/);
  assert.match(report.errors.join("\n"), /live_execution_allowed must be false/);
  assert.match(report.errors.join("\n"), /total_trace_records must equal total_steps_observed/);
});

test("StrategyDryRunCaseFileSummary validator rejects status mismatches and forbidden fields", async () => {
  const summary = await loadSummary();
  const report = validateStrategyDryRunCaseFileSummary({
    ...summary,
    consistency_status: "consistency_failed",
    signal_request: { status: "blocked" }
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /ready dry-run case-file summaries require consistency_passed/);
  assert.match(report.errors.join("\n"), /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/);
});

async function loadSummary() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
