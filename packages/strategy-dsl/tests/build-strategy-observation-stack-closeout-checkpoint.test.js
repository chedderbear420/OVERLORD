import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { buildStrategyObservationStackCloseoutCheckpoint } from "../src/build-strategy-observation-stack-closeout-checkpoint.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_stack_closeout_checkpoint.json");

test("buildStrategyObservationStackCloseoutCheckpoint matches synthetic fixture", async () => {
  const checkpoint = await buildStrategyObservationStackCloseoutCheckpoint({ repoRoot });
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

  assert.deepEqual(checkpoint, fixture);
});

test("buildStrategyObservationStackCloseoutCheckpoint inventories Phase 3 observation stack without execution", async () => {
  const checkpoint = await buildStrategyObservationStackCloseoutCheckpoint({ repoRoot });

  assert.equal(checkpoint.closeout_artifacts.length, 6);
  assert.equal(checkpoint.closeout_checks.length, 15);
  assert.equal(checkpoint.closeout_checks.every((check) => check.status === "check_passed"), true);
  assert.equal(checkpoint.consistency_status, "consistency_passed");
  assert.equal(checkpoint.freeze_recommendation, "freeze_ready");
  assert.equal(checkpoint.status, "observation_stack_closeout_ready");
  assert.equal(checkpoint.live_execution_allowed, false);
  assert.equal(checkpoint.order_placement_allowed, false);
});
