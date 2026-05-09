import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { buildStrategyObservationProcessingInputSet } from "../src/build-strategy-observation-processing-input-set.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_processing_input_set.json");

test("buildStrategyObservationProcessingInputSet matches synthetic fixture", async () => {
  const inputSet = await buildStrategyObservationProcessingInputSet({ repoRoot });
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

  assert.deepEqual(inputSet, fixture);
});

test("buildStrategyObservationProcessingInputSet inventories read-only Phase 3 inputs", async () => {
  const inputSet = await buildStrategyObservationProcessingInputSet({ repoRoot });

  assert.equal(inputSet.input_artifacts.length, 7);
  assert.equal(inputSet.paper_only, true);
  assert.equal(inputSet.live_execution_allowed, false);
  assert.equal(inputSet.order_placement_allowed, false);
  assert.equal(inputSet.status, "strategy_observation_processing_input_set_ready");
  assert.equal(inputSet.input_artifacts.every((artifact) => artifact.access_mode === "read_only"), true);
  assert.equal(inputSet.input_artifacts.some((artifact) => artifact.artifact_type === "strategy_observation_stack_closeout_checkpoint"), true);
});
