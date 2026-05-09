import path from "node:path";
import { readFile } from "node:fs/promises";

export const defaultStrategyObservationArtifactPaths = {
  observationContractPath: "packages/strategy-dsl/fixtures/synthetic_strategy_observation_contract.json",
  observationInputSetPath: "packages/strategy-dsl/fixtures/synthetic_strategy_observation_input_set.json",
  observationTracePath: "packages/strategy-dsl/fixtures/synthetic_strategy_observation_trace.jsonl",
  observationNoopSummaryPath: "packages/strategy-dsl/fixtures/synthetic_strategy_observation_noop_summary.json"
};

export const strategyObservationArtifactContracts = [
  {
    artifact_type: "strategy_observation_contract",
    pathKey: "observationContractPath",
    schema_version: "strategy_observation_contract.v1",
    validation_command: "npm run validate:strategy-observation-contract",
    id_field: "strategy_observation_contract_id"
  },
  {
    artifact_type: "strategy_observation_input_set",
    pathKey: "observationInputSetPath",
    schema_version: "strategy_observation_input_set.v1",
    validation_command: "npm run validate:strategy-observation-input-set",
    id_field: "strategy_observation_input_set_id"
  },
  {
    artifact_type: "strategy_observation_trace",
    pathKey: "observationTracePath",
    schema_version: "strategy_observation_trace.v1",
    validation_command: "npm run validate:strategy-observation-trace",
    id_field: null
  },
  {
    artifact_type: "strategy_observation_noop_summary",
    pathKey: "observationNoopSummaryPath",
    schema_version: "strategy_observation_noop_summary.v1",
    validation_command: "npm run validate:strategy-observation-noop-summary",
    id_field: "strategy_observation_noop_summary_id"
  }
];

export async function readStrategyObservationSources(repoRoot, paths) {
  return {
    observationContract: await readJson(repoRoot, paths.observationContractPath),
    observationInputSet: await readJson(repoRoot, paths.observationInputSetPath),
    observationTraces: await readJsonl(repoRoot, paths.observationTracePath),
    observationNoopSummary: await readJson(repoRoot, paths.observationNoopSummaryPath)
  };
}

export async function countStrategyObservationArtifactRecords(repoRoot, artifactPath) {
  if (artifactPath.endsWith(".jsonl")) {
    return (await readJsonl(repoRoot, artifactPath)).length;
  }
  JSON.parse(await readFile(path.join(repoRoot, artifactPath), "utf8"));
  return 1;
}

export async function readJson(repoRoot, repoPath) {
  return JSON.parse(await readFile(path.join(repoRoot, repoPath), "utf8"));
}

export async function readJsonl(repoRoot, repoPath) {
  return (await readFile(path.join(repoRoot, repoPath), "utf8"))
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}
