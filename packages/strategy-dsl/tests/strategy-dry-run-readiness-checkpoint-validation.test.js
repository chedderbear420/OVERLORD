import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateStrategyDryRunReadinessCheckpoint,
  validateStrategyDryRunReadinessCheckpointFile
} from "../src/validate-strategy-dry-run-readiness-checkpoint.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_dry_run_readiness_checkpoint.json");

test("synthetic StrategyDryRunReadinessCheckpoint fixture validates", async () => {
  const report = await validateStrategyDryRunReadinessCheckpointFile({ filePath: fixturePath, repoRoot });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("StrategyDryRunReadinessCheckpoint rejects unsafe flags, bad ids, and unsafe paths", async () => {
  const checkpoint = await loadCheckpoint();
  const report = await validateStrategyDryRunReadinessCheckpoint({
    ...checkpoint,
    strategy_dry_run_readiness_checkpoint_id: "bad",
    live_execution_allowed: true,
    prerequisite_artifacts: checkpoint.prerequisite_artifacts.map((artifact, index) => index === 0
      ? { ...artifact, artifact_path: "../.env" }
      : artifact)
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /strategy_dry_run_readiness_checkpoint_id must be deterministic/);
  assert.match(report.errors.join("\n"), /live_execution_allowed must be false/);
  assert.match(report.errors.join("\n"), /artifact_path must not escape the repo|artifact_path must not reference credentials/);
});

test("StrategyDryRunReadinessCheckpoint rejects failed ready checks and forbidden fields", async () => {
  const checkpoint = await loadCheckpoint();
  const report = await validateStrategyDryRunReadinessCheckpoint({
    ...checkpoint,
    readiness_checks: checkpoint.readiness_checks.map((check) => check.check_name === "safety_flags_validated"
      ? { ...check, status: "check_failed" }
      : check),
    order_request: { side: "YES" }
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /dry_run_ready requires all required readiness checks to pass/);
  assert.match(report.errors.join("\n"), /failed readiness checks require dry_run_not_ready/);
  assert.match(report.errors.join("\n"), /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/);
});

async function loadCheckpoint() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
