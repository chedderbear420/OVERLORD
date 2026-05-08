import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateStrategyDryRunPlanEvidenceSummary,
  validateStrategyDryRunPlanEvidenceSummaryFile
} from "../src/validate-strategy-dry-run-plan-evidence-summary.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_dry_run_plan_evidence_summary.json");

test("synthetic StrategyDryRunPlanEvidenceSummary fixture validates", async () => {
  const report = await validateStrategyDryRunPlanEvidenceSummaryFile({ filePath: fixturePath, repoRoot });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("StrategyDryRunPlanEvidenceSummary rejects unsafe flags, bad ids, and bad counts", async () => {
  const summary = await loadSummary();
  const report = await validateStrategyDryRunPlanEvidenceSummary({
    ...summary,
    strategy_dry_run_plan_evidence_summary_id: "bad",
    live_execution_allowed: true,
    allowed_input_artifact_count: 7
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /strategy_dry_run_plan_evidence_summary_id must be deterministic/);
  assert.match(report.errors.join("\n"), /live_execution_allowed must be false/);
  assert.match(report.errors.join("\n"), /allowed_input_artifact_count must match source StrategyDryRunPlan/);
});

test("StrategyDryRunPlanEvidenceSummary rejects status mismatches and forbidden fields", async () => {
  const summary = await loadSummary();
  const report = await validateStrategyDryRunPlanEvidenceSummary({
    ...summary,
    validation_status: "validation_failed",
    order_request: { side: "YES" }
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /ready StrategyDryRunPlanEvidenceSummary requires validation_passed/);
  assert.match(report.errors.join("\n"), /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/);
});

async function loadSummary() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
