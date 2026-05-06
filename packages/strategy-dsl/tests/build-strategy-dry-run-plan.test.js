import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { buildStrategyDryRunPlan } from "../src/build-strategy-dry-run-plan.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_dry_run_plan.json");

test("buildStrategyDryRunPlan matches synthetic fixture", async () => {
  const plan = await buildStrategyDryRunPlan({ repoRoot });
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

  assert.deepEqual(plan, fixture);
});

test("buildStrategyDryRunPlan preserves strategy run provenance and stays metadata-only", async () => {
  const plan = await buildStrategyDryRunPlan({ repoRoot });

  assert.equal(plan.source_strategy_definition_id, plan.strategy_definition_id);
  assert.equal(plan.source_strategy_run_intent_id, plan.strategy_run_intent_id);
  assert.equal(plan.source_strategy_run_manifest_id, plan.strategy_run_manifest_id);
  assert.equal(plan.source_strategy_run_evidence_bundle_id, plan.strategy_run_evidence_bundle_id);
  assert.equal(plan.paper_only, true);
  assert.equal(plan.live_execution_allowed, false);
  assert.equal(plan.order_placement_allowed, false);
  assert.equal(plan.status, "strategy_dry_run_plan_ready");
  assert.equal(plan.planned_observation_steps.every((step) => step.metadata_only === true), true);
  assert.equal(plan.forbidden_outputs.includes("edge_signal"), true);
  assert.equal(plan.forbidden_outputs.includes("paper_exit"), true);
});
