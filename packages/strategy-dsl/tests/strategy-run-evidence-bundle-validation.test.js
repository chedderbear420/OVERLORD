import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateStrategyRunEvidenceBundle,
  validateStrategyRunEvidenceBundleFile
} from "../src/validate-strategy-run-evidence-bundle.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_run_evidence_bundle.json");

test("synthetic StrategyRunEvidenceBundle fixture validates", async () => {
  const report = await validateStrategyRunEvidenceBundleFile({ filePath: fixturePath, repoRoot });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("StrategyRunEvidenceBundle validator rejects unsafe flags, bad ids, and bad totals", async () => {
  const bundle = await loadBundle();
  const report = await validateStrategyRunEvidenceBundle({
    ...bundle,
    strategy_run_evidence_bundle_id: "bad",
    order_placement_allowed: true,
    strategy_noop_totals: { ...bundle.strategy_noop_totals, total_inputs_observed: 17 }
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /strategy_run_evidence_bundle_id must be deterministic/);
  assert.match(report.errors.join("\n"), /order_placement_allowed must be false/);
  assert.match(report.errors.join("\n"), /strategy_noop_totals total_trace_records must equal total_inputs_observed/);
});

test("StrategyRunEvidenceBundle validator rejects failed ready checks and forbidden fields", async () => {
  const bundle = await loadBundle();
  const report = await validateStrategyRunEvidenceBundle({
    ...bundle,
    consistency_checks: bundle.consistency_checks.map((check, index) => index === 0 ? { ...check, status: "check_failed" } : check),
    recommendation: "trade"
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /ready strategy run evidence bundles must not contain failed consistency checks/);
  assert.match(report.errors.join("\n"), /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/);
});

async function loadBundle() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
