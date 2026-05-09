import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateStrategyObservationProcessingInputSet,
  validateStrategyObservationProcessingInputSetFile
} from "../src/validate-strategy-observation-processing-input-set.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_processing_input_set.json");

test("synthetic StrategyObservationProcessingInputSet fixture validates", async () => {
  const report = await validateStrategyObservationProcessingInputSetFile({ filePath: fixturePath });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("StrategyObservationProcessingInputSet validator rejects unsafe flags, bad ids, and bad counts", async () => {
  const inputSet = await loadInputSet();
  const report = await validateStrategyObservationProcessingInputSet({
    ...inputSet,
    strategy_observation_processing_input_set_id: "bad",
    order_placement_allowed: true,
    input_artifacts: [
      {
        ...inputSet.input_artifacts[0],
        record_count: -1
      }
    ]
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /strategy_observation_processing_input_set_id must be deterministic/);
  assert.match(report.errors.join("\n"), /order_placement_allowed must be false/);
  assert.match(report.errors.join("\n"), /input_artifact record_count must be a non-negative integer/);
});

test("StrategyObservationProcessingInputSet validator rejects unsafe paths and forbidden fields", async () => {
  const inputSet = await loadInputSet();
  const report = await validateStrategyObservationProcessingInputSet({
    ...inputSet,
    input_artifacts: [
      {
        ...inputSet.input_artifacts[0],
        artifact_path: "../secrets/api_key.json"
      }
    ],
    recommendation: { status: "blocked" }
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /input_artifact artifact_path/);
  assert.match(report.errors.join("\n"), /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/);
});

async function loadInputSet() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
