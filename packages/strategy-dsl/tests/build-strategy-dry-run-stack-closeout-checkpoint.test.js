import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { buildStrategyDryRunStackCloseoutCheckpoint } from "../src/build-strategy-dry-run-stack-closeout-checkpoint.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_dry_run_stack_closeout_checkpoint.json");

test("buildStrategyDryRunStackCloseoutCheckpoint matches synthetic fixture", async () => {
  const checkpoint = await buildStrategyDryRunStackCloseoutCheckpoint({ repoRoot });
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

  assert.deepEqual(checkpoint, fixture);
});

test("buildStrategyDryRunStackCloseoutCheckpoint inventories Phase 2 dry-run stack without execution", async () => {
  const checkpoint = await buildStrategyDryRunStackCloseoutCheckpoint({ repoRoot });

  assert.equal(checkpoint.closeout_artifacts.length, 11);
  assert.equal(checkpoint.closeout_checks.length, 17);
  assert.equal(checkpoint.closeout_checks.every((check) => check.status === "check_passed"), true);
  assert.equal(checkpoint.readiness_status, "dry_run_ready");
  assert.equal(checkpoint.consistency_status, "consistency_passed");
  assert.equal(checkpoint.freeze_recommendation, "freeze_ready");
  assert.equal(checkpoint.status, "dry_run_stack_closeout_ready");
  assert.equal(checkpoint.live_execution_allowed, false);
  assert.equal(checkpoint.order_placement_allowed, false);
});
