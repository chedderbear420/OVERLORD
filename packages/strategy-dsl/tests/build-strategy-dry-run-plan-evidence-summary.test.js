import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { buildStrategyDryRunPlanEvidenceSummary } from "../src/build-strategy-dry-run-plan-evidence-summary.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_dry_run_plan_evidence_summary.json");

test("buildStrategyDryRunPlanEvidenceSummary matches synthetic fixture", async () => {
  const summary = await buildStrategyDryRunPlanEvidenceSummary({ repoRoot });
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

  assert.deepEqual(summary, fixture);
});

test("buildStrategyDryRunPlanEvidenceSummary inventories plan validation without execution", async () => {
  const summary = await buildStrategyDryRunPlanEvidenceSummary({ repoRoot });

  assert.equal(summary.source_strategy_dry_run_plan_id, summary.strategy_dry_run_plan_id);
  assert.equal(summary.validation_status, "validation_passed");
  assert.equal(summary.status, "dry_run_plan_evidence_summary_ready");
  assert.equal(summary.allowed_input_artifact_count, 8);
  assert.equal(summary.forbidden_output_count, 11);
  assert.equal(summary.planned_observation_step_count, 5);
  assert.equal(summary.safety_constraint_count, 6);
  assert.equal(summary.paper_only, true);
  assert.equal(summary.live_execution_allowed, false);
  assert.equal(summary.order_placement_allowed, false);
});
