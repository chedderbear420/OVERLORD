import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateStrategyDryRunNoOpSummary,
  validateStrategyDryRunNoOpSummaryFile
} from "../src/validate-strategy-dry-run-noop-summary.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_dry_run_noop_summary.json");

test("synthetic StrategyDryRunNoOpSummary fixture validates", async () => {
  const report = await validateStrategyDryRunNoOpSummaryFile({ filePath: fixturePath });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("StrategyDryRunNoOpSummary validator rejects unsafe flags, bad ids, and bad totals", async () => {
  const summary = await loadSummary();
  const report = validateStrategyDryRunNoOpSummary({
    ...summary,
    strategy_dry_run_noop_summary_id: "bad",
    order_placement_allowed: true,
    total_trace_records: 3
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /strategy_dry_run_noop_summary_id must be deterministic/);
  assert.match(report.errors.join("\n"), /order_placement_allowed must be false/);
  assert.match(report.errors.join("\n"), /total_trace_records must equal total_steps_observed plus start and completed trace records/);
});

test("StrategyDryRunNoOpSummary validator rejects readiness mismatch and forbidden fields", async () => {
  const summary = await loadSummary();
  const report = validateStrategyDryRunNoOpSummary({
    ...summary,
    readiness_status: "dry_run_not_ready",
    live_trade_recommendation: "forbidden"
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /ready dry-run no-op summary requires dry_run_ready readiness_status/);
  assert.match(report.errors.join("\n"), /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/);
});

async function loadSummary() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
