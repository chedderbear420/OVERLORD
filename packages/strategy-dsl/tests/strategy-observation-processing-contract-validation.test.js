import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateStrategyObservationProcessingContract,
  validateStrategyObservationProcessingContractFile
} from "../src/validate-strategy-observation-processing-contract.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_processing_contract.json");

test("synthetic StrategyObservationProcessingContract fixture validates", async () => {
  const report = await validateStrategyObservationProcessingContractFile({ filePath: fixturePath });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("StrategyObservationProcessingContract validator rejects unsafe flags, bad ids, and bad rules", async () => {
  const contract = await loadContract();
  const report = validateStrategyObservationProcessingContract({
    ...contract,
    strategy_observation_processing_contract_id: "bad",
    live_execution_allowed: true,
    processing_rules: [...contract.processing_rules, "execute_strategy"]
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /strategy_observation_processing_contract_id must be deterministic/);
  assert.match(report.errors.join("\n"), /live_execution_allowed must be false/);
  assert.match(report.errors.join("\n"), /processing_rules contains invalid rule/);
});

test("StrategyObservationProcessingContract validator rejects missing forbidden outputs and forbidden fields", async () => {
  const contract = await loadContract();
  const report = validateStrategyObservationProcessingContract({
    ...contract,
    forbidden_processing_outputs: contract.forbidden_processing_outputs.filter((output) => output !== "edge_signal"),
    analytics: { status: "blocked" }
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /forbidden_processing_outputs must include edge_signal/);
  assert.match(report.errors.join("\n"), /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/);
});

async function loadContract() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
