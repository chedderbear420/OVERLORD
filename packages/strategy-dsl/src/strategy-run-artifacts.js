import path from "node:path";
import { readFile } from "node:fs/promises";

export const defaultStrategyArtifactPaths = {
  definitionPath: "packages/strategy-dsl/fixtures/synthetic_strategy_definition.json",
  intentPath: "packages/strategy-dsl/fixtures/synthetic_strategy_run_intent.json",
  tracePath: "packages/strategy-dsl/fixtures/synthetic_strategy_run_trace.jsonl",
  summaryPath: "packages/strategy-dsl/fixtures/synthetic_strategy_noop_run_summary.json"
};

export const strategyArtifactContracts = [
  {
    artifact_type: "strategy_definition",
    pathKey: "definitionPath",
    schema_version: "strategy_definition.v1",
    validation_command: "npm run validate:strategy-definition",
    id_field: "strategy_definition_id"
  },
  {
    artifact_type: "strategy_run_intent",
    pathKey: "intentPath",
    schema_version: "strategy_run_intent.v1",
    validation_command: "npm run validate:strategy-run-intent",
    id_field: "strategy_run_intent_id"
  },
  {
    artifact_type: "strategy_run_trace",
    pathKey: "tracePath",
    schema_version: "strategy_run_trace.v1",
    validation_command: "npm run validate:strategy-run-trace",
    id_field: null
  },
  {
    artifact_type: "strategy_noop_run_summary",
    pathKey: "summaryPath",
    schema_version: "strategy_noop_run_summary.v1",
    validation_command: "npm run validate:strategy-noop-run-summary",
    id_field: "strategy_noop_run_summary_id"
  }
];

export async function readStrategyRunSources(repoRoot, paths) {
  return {
    definition: await readJson(repoRoot, paths.definitionPath),
    intent: await readJson(repoRoot, paths.intentPath),
    traces: await readJsonl(repoRoot, paths.tracePath),
    summary: await readJson(repoRoot, paths.summaryPath)
  };
}

export async function countStrategyArtifactRecords(repoRoot, artifactPath) {
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
