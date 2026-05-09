import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateStrategyObservationStackCloseoutCheckpoint,
  validateStrategyObservationStackCloseoutCheckpointFile
} from "../src/validate-strategy-observation-stack-closeout-checkpoint.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_stack_closeout_checkpoint.json");

test("synthetic StrategyObservationStackCloseoutCheckpoint fixture validates", async () => {
  const report = await validateStrategyObservationStackCloseoutCheckpointFile({ filePath: fixturePath, repoRoot });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("StrategyObservationStackCloseoutCheckpoint validator rejects unsafe flags, bad ids, and bad artifact counts", async () => {
  const checkpoint = await loadCheckpoint();
  const report = await validateStrategyObservationStackCloseoutCheckpoint({
    ...checkpoint,
    strategy_observation_stack_closeout_checkpoint_id: "bad",
    live_execution_allowed: true,
    closeout_artifacts: checkpoint.closeout_artifacts.map((artifact) => artifact.artifact_type === "strategy_observation_trace"
      ? { ...artifact, record_count: 99 }
      : artifact)
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /strategy_observation_stack_closeout_checkpoint_id must be deterministic/);
  assert.match(report.errors.join("\n"), /live_execution_allowed must be false/);
  assert.match(report.errors.join("\n"), /record_count must match local fixture count/);
});

test("StrategyObservationStackCloseoutCheckpoint validator rejects status mismatches and forbidden fields", async () => {
  const checkpoint = await loadCheckpoint();
  const report = await validateStrategyObservationStackCloseoutCheckpoint({
    ...checkpoint,
    closeout_checks: checkpoint.closeout_checks.map((check, index) => index === 0 ? { ...check, status: "check_failed" } : check),
    signal_request: { status: "blocked" }
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /failed observation closeout checks require observation_stack_closeout_rejected status/);
  assert.match(report.errors.join("\n"), /failed observation closeout checks require freeze_not_ready/);
  assert.match(report.errors.join("\n"), /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/);
});

async function loadCheckpoint() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
