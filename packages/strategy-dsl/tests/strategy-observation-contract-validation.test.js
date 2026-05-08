import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateStrategyObservationContract,
  validateStrategyObservationContractFile
} from "../src/validate-strategy-observation-contract.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_contract.json");

test("synthetic StrategyObservationContract fixture validates", async () => {
  const report = await validateStrategyObservationContractFile({ filePath: fixturePath });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("StrategyObservationContract validator rejects unsafe flags, bad ids, and bad rules", async () => {
  const contract = await loadContract();
  const report = validateStrategyObservationContract({
    ...contract,
    strategy_observation_contract_id: "bad",
    live_execution_allowed: true,
    observation_rules: [...contract.observation_rules, "execute_strategy"]
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /strategy_observation_contract_id must be deterministic/);
  assert.match(report.errors.join("\n"), /live_execution_allowed must be false/);
  assert.match(report.errors.join("\n"), /observation_rules contains invalid rule/);
});

test("StrategyObservationContract validator rejects missing forbidden outputs and forbidden fields", async () => {
  const contract = await loadContract();
  const report = validateStrategyObservationContract({
    ...contract,
    forbidden_observation_outputs: contract.forbidden_observation_outputs.filter((output) => output !== "edge_signal"),
    decision_request: { status: "blocked" }
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /forbidden_observation_outputs must include edge_signal/);
  assert.match(report.errors.join("\n"), /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/);
});

async function loadContract() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
