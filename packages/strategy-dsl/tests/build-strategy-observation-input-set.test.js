import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { buildStrategyObservationInputSet } from "../src/build-strategy-observation-input-set.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_input_set.json");

test("buildStrategyObservationInputSet matches synthetic fixture", async () => {
  const inputSet = await buildStrategyObservationInputSet({ repoRoot });
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

  assert.deepEqual(inputSet, fixture);
});

test("buildStrategyObservationInputSet inventories read-only inputs", async () => {
  const inputSet = await buildStrategyObservationInputSet({ repoRoot });

  assert.equal(inputSet.input_artifacts.length, 5);
  assert.equal(inputSet.input_artifacts.every((artifact) => artifact.access_mode === "read_only"), true);
  assert.equal(inputSet.input_artifacts.some((artifact) => artifact.artifact_type === "strategy_dry_run_trace" && artifact.record_count === 7), true);
  assert.equal(inputSet.paper_only, true);
  assert.equal(inputSet.live_execution_allowed, false);
  assert.equal(inputSet.order_placement_allowed, false);
  assert.equal(inputSet.status, "strategy_observation_input_set_ready");
});
