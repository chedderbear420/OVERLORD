import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { buildStrategyDryRunReadinessCheckpoint } from "../src/build-strategy-dry-run-readiness-checkpoint.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_dry_run_readiness_checkpoint.json");

test("buildStrategyDryRunReadinessCheckpoint matches synthetic fixture", async () => {
  const checkpoint = await buildStrategyDryRunReadinessCheckpoint({ repoRoot });
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

  assert.deepEqual(checkpoint, fixture);
});

test("buildStrategyDryRunReadinessCheckpoint inventories prerequisites without execution", async () => {
  const checkpoint = await buildStrategyDryRunReadinessCheckpoint({ repoRoot });

  assert.equal(checkpoint.readiness_status, "dry_run_ready");
  assert.equal(checkpoint.status, "dry_run_readiness_checkpoint_ready");
  assert.equal(checkpoint.prerequisite_artifacts.length, 6);
  assert.equal(checkpoint.readiness_checks.length, 10);
  assert.equal(checkpoint.paper_only, true);
  assert.equal(checkpoint.live_execution_allowed, false);
  assert.equal(checkpoint.order_placement_allowed, false);
  assert.ok(checkpoint.readiness_checks.every((check) => check.status === "check_passed"));
});
