import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { buildStrategyDryRunCaseFileSummary } from "../src/build-strategy-dry-run-case-file-summary.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_dry_run_case_file_summary.json");

test("buildStrategyDryRunCaseFileSummary matches synthetic fixture", async () => {
  const summary = await buildStrategyDryRunCaseFileSummary({ repoRoot });
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

  assert.deepEqual(summary, fixture);
});

test("buildStrategyDryRunCaseFileSummary preserves no-op dry-run totals", async () => {
  const summary = await buildStrategyDryRunCaseFileSummary({ repoRoot });

  assert.equal(summary.total_evidence_artifacts, 5);
  assert.equal(summary.total_trace_records, 7);
  assert.equal(summary.total_steps_observed, 5);
  assert.equal(summary.readiness_status, "dry_run_ready");
  assert.equal(summary.consistency_status, "consistency_passed");
  assert.equal(summary.status, "dry_run_case_file_summary_ready");
});
