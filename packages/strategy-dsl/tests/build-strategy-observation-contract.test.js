import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  allowedObservationInputs,
  allowedObservationRules,
  buildStrategyObservationContract,
  requiredForbiddenObservationOutputs
} from "../src/build-strategy-observation-contract.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_contract.json");

test("buildStrategyObservationContract matches synthetic fixture", async () => {
  const contract = await buildStrategyObservationContract({ repoRoot });
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

  assert.deepEqual(contract, fixture);
});

test("buildStrategyObservationContract defines read-only observation boundaries", async () => {
  const contract = await buildStrategyObservationContract({ repoRoot });

  assert.equal(contract.allowed_observation_inputs.length, allowedObservationInputs.length);
  assert.equal(contract.forbidden_observation_outputs.length, requiredForbiddenObservationOutputs.length);
  assert.equal(contract.observation_rules.length, allowedObservationRules.length);
  assert.equal(contract.paper_only, true);
  assert.equal(contract.live_execution_allowed, false);
  assert.equal(contract.order_placement_allowed, false);
  assert.equal(contract.status, "strategy_observation_contract_ready");
  assert.equal(contract.forbidden_observation_outputs.includes("edge_signal"), true);
  assert.equal(contract.forbidden_observation_outputs.includes("action_decision"), true);
  assert.equal(contract.forbidden_observation_outputs.includes("analytics"), true);
});
