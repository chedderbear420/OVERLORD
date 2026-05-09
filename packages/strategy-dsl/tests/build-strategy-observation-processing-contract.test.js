import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  allowedProcessingInputs,
  allowedProcessingOutputs,
  allowedProcessingRules,
  buildStrategyObservationProcessingContract,
  requiredForbiddenProcessingOutputs
} from "../src/build-strategy-observation-processing-contract.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_processing_contract.json");

test("buildStrategyObservationProcessingContract matches synthetic fixture", async () => {
  const contract = await buildStrategyObservationProcessingContract({ repoRoot });
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

  assert.deepEqual(contract, fixture);
});

test("buildStrategyObservationProcessingContract defines metadata-only processing boundaries", async () => {
  const contract = await buildStrategyObservationProcessingContract({ repoRoot });

  assert.equal(contract.allowed_processing_inputs.length, allowedProcessingInputs.length);
  assert.equal(contract.allowed_processing_outputs.length, allowedProcessingOutputs.length);
  assert.equal(contract.forbidden_processing_outputs.length, requiredForbiddenProcessingOutputs.length);
  assert.equal(contract.processing_rules.length, allowedProcessingRules.length);
  assert.equal(contract.paper_only, true);
  assert.equal(contract.live_execution_allowed, false);
  assert.equal(contract.order_placement_allowed, false);
  assert.equal(contract.status, "strategy_observation_processing_contract_ready");
  assert.equal(contract.forbidden_processing_outputs.includes("edge_signal"), true);
  assert.equal(contract.forbidden_processing_outputs.includes("action_decision"), true);
  assert.equal(contract.forbidden_processing_outputs.includes("analytics"), true);
  assert.equal(contract.forbidden_processing_outputs.includes("strategy_analytics"), true);
});
