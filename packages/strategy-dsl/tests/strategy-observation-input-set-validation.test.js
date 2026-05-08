import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateStrategyObservationInputSet,
  validateStrategyObservationInputSetFile
} from "../src/validate-strategy-observation-input-set.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_input_set.json");

test("synthetic StrategyObservationInputSet fixture validates", async () => {
  const report = await validateStrategyObservationInputSetFile({ filePath: fixturePath, repoRoot });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("StrategyObservationInputSet validator rejects unsafe flags, bad ids, and bad counts", async () => {
  const inputSet = await loadInputSet();
  const report = await validateStrategyObservationInputSet({
    ...inputSet,
    strategy_observation_input_set_id: "bad",
    order_placement_allowed: true,
    input_artifacts: inputSet.input_artifacts.map((artifact) => artifact.artifact_type === "strategy_dry_run_trace"
      ? { ...artifact, record_count: 99 }
      : artifact)
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /strategy_observation_input_set_id must be deterministic/);
  assert.match(report.errors.join("\n"), /order_placement_allowed must be false/);
  assert.match(report.errors.join("\n"), /record_count must match local fixture count/);
});

test("StrategyObservationInputSet validator rejects unsafe paths and forbidden fields", async () => {
  const inputSet = await loadInputSet();
  const report = await validateStrategyObservationInputSet({
    ...inputSet,
    input_artifacts: inputSet.input_artifacts.map((artifact, index) => index === 0
      ? { ...artifact, artifact_path: "../.env" }
      : artifact),
    signal_request: { status: "blocked" }
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /artifact_path/);
  assert.match(report.errors.join("\n"), /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/);
});

async function loadInputSet() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
