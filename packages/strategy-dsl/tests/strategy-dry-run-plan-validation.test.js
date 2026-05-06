import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateStrategyDryRunPlan,
  validateStrategyDryRunPlanFile
} from "../src/validate-strategy-dry-run-plan.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_dry_run_plan.json");

test("synthetic StrategyDryRunPlan fixture validates", async () => {
  const report = await validateStrategyDryRunPlanFile({ filePath: fixturePath, repoRoot });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("StrategyDryRunPlan validator rejects unsafe flags, bad ids, and unsafe paths", async () => {
  const plan = await loadPlan();
  const report = await validateStrategyDryRunPlan({
    ...plan,
    strategy_dry_run_plan_id: "bad",
    live_execution_allowed: true,
    allowed_input_artifacts: plan.allowed_input_artifacts.map((artifact, index) => index === 0 ? {
      ...artifact,
      artifact_path: "../secrets/live_config.json"
    } : artifact)
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /strategy_dry_run_plan_id must be deterministic/);
  assert.match(report.errors.join("\n"), /live_execution_allowed must be false/);
  assert.match(report.errors.join("\n"), /allowed_input artifact_path artifact_path must not escape the repo/);
});

test("StrategyDryRunPlan validator rejects forbidden outputs, steps, constraints, and fields", async () => {
  const plan = await loadPlan();
  const report = await validateStrategyDryRunPlan({
    ...plan,
    forbidden_outputs: plan.forbidden_outputs.filter((output) => output !== "edge_signal"),
    planned_observation_steps: plan.planned_observation_steps.map((step, index) => index === 2 ? {
      ...step,
      step_type: "generate_signal"
    } : step),
    safety_constraints: plan.safety_constraints.filter((constraint) => constraint !== "no_network"),
    order_request: { side: "YES" }
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /forbidden_outputs must include edge_signal/);
  assert.match(report.errors.join("\n"), /planned_observation_step step_type is invalid/);
  assert.match(report.errors.join("\n"), /safety_constraints must include no_network/);
  assert.match(report.errors.join("\n"), /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/);
});

async function loadPlan() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
