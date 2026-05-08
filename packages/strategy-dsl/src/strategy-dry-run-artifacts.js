import path from "node:path";
import { readFile } from "node:fs/promises";

export const defaultStrategyDryRunArtifactPaths = {
  readinessCheckpointPath: "packages/strategy-dsl/fixtures/synthetic_strategy_dry_run_readiness_checkpoint.json",
  dryRunPlanPath: "packages/strategy-dsl/fixtures/synthetic_strategy_dry_run_plan.json",
  dryRunPlanEvidenceSummaryPath: "packages/strategy-dsl/fixtures/synthetic_strategy_dry_run_plan_evidence_summary.json",
  dryRunTracePath: "packages/strategy-dsl/fixtures/synthetic_strategy_dry_run_trace.jsonl",
  dryRunNoopSummaryPath: "packages/strategy-dsl/fixtures/synthetic_strategy_dry_run_noop_summary.json"
};

export const strategyDryRunArtifactContracts = [
  {
    artifact_type: "strategy_dry_run_readiness_checkpoint",
    pathKey: "readinessCheckpointPath",
    schema_version: "strategy_dry_run_readiness_checkpoint.v1",
    validation_command: "npm run validate:strategy-dry-run-readiness-checkpoint",
    id_field: "strategy_dry_run_readiness_checkpoint_id"
  },
  {
    artifact_type: "strategy_dry_run_plan",
    pathKey: "dryRunPlanPath",
    schema_version: "strategy_dry_run_plan.v1",
    validation_command: "npm run validate:strategy-dry-run-plan",
    id_field: "strategy_dry_run_plan_id"
  },
  {
    artifact_type: "strategy_dry_run_plan_evidence_summary",
    pathKey: "dryRunPlanEvidenceSummaryPath",
    schema_version: "strategy_dry_run_plan_evidence_summary.v1",
    validation_command: "npm run validate:strategy-dry-run-plan-evidence-summary",
    id_field: "strategy_dry_run_plan_evidence_summary_id"
  },
  {
    artifact_type: "strategy_dry_run_trace",
    pathKey: "dryRunTracePath",
    schema_version: "strategy_dry_run_trace.v1",
    validation_command: "npm run validate:strategy-dry-run-trace",
    id_field: null
  },
  {
    artifact_type: "strategy_dry_run_noop_summary",
    pathKey: "dryRunNoopSummaryPath",
    schema_version: "strategy_dry_run_noop_summary.v1",
    validation_command: "npm run validate:strategy-dry-run-noop-summary",
    id_field: "strategy_dry_run_noop_summary_id"
  }
];

export async function readStrategyDryRunSources(repoRoot, paths) {
  return {
    readinessCheckpoint: await readJson(repoRoot, paths.readinessCheckpointPath),
    dryRunPlan: await readJson(repoRoot, paths.dryRunPlanPath),
    dryRunPlanEvidenceSummary: await readJson(repoRoot, paths.dryRunPlanEvidenceSummaryPath),
    dryRunTraces: await readJsonl(repoRoot, paths.dryRunTracePath),
    dryRunNoopSummary: await readJson(repoRoot, paths.dryRunNoopSummaryPath)
  };
}

export async function countStrategyDryRunArtifactRecords(repoRoot, artifactPath) {
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
