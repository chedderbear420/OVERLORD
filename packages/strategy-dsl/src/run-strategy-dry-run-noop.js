import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { buildStrategyDryRunNoOpSummary, buildStrategyDryRunTraces } from "./build-strategy-dry-run-trace.js";
import { validateStrategyDryRunReadinessCheckpoint } from "./validate-strategy-dry-run-readiness-checkpoint.js";
import { validateStrategyDryRunPlan } from "./validate-strategy-dry-run-plan.js";
import { validateStrategyDryRunPlanEvidenceSummary } from "./validate-strategy-dry-run-plan-evidence-summary.js";
import { validateStrategyRunTraces } from "./validate-strategy-run-trace.js";
import { validateStrategyNoopRunSummary } from "./validate-strategy-noop-run-summary.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultReadinessCheckpointPath = "packages/strategy-dsl/fixtures/synthetic_strategy_dry_run_readiness_checkpoint.json";
const defaultDryRunPlanPath = "packages/strategy-dsl/fixtures/synthetic_strategy_dry_run_plan.json";
const defaultDryRunPlanEvidenceSummaryPath = "packages/strategy-dsl/fixtures/synthetic_strategy_dry_run_plan_evidence_summary.json";
const defaultStrategyRunTracePath = "packages/strategy-dsl/fixtures/synthetic_strategy_run_trace.jsonl";
const defaultStrategyNoopSummaryPath = "packages/strategy-dsl/fixtures/synthetic_strategy_noop_run_summary.json";

export async function runStrategyDryRunNoop(options = {}) {
  const root = options.repoRoot ?? repoRoot;
  const readinessCheckpoint = options.readinessCheckpoint
    ?? await readJson(root, options.readinessCheckpointPath ?? defaultReadinessCheckpointPath);
  const dryRunPlan = options.dryRunPlan
    ?? await readJson(root, options.dryRunPlanPath ?? defaultDryRunPlanPath);
  const dryRunPlanEvidenceSummary = options.dryRunPlanEvidenceSummary
    ?? await readJson(root, options.dryRunPlanEvidenceSummaryPath ?? defaultDryRunPlanEvidenceSummaryPath);
  const strategyRunTraces = options.strategyRunTraces
    ?? parseJsonl(await readFile(path.join(root, options.strategyRunTracePath ?? defaultStrategyRunTracePath), "utf8"));
  const strategyNoopSummary = options.strategyNoopSummary
    ?? await readJson(root, options.strategyNoopSummaryPath ?? defaultStrategyNoopSummaryPath);
  const generatedAt = options.generatedAt ?? readinessCheckpoint.generated_at;

  await assertValidInputs(root, readinessCheckpoint, dryRunPlan, dryRunPlanEvidenceSummary, strategyRunTraces, strategyNoopSummary);
  assertReadyCheckpoint(readinessCheckpoint);
  assertLinkedInputs(readinessCheckpoint, dryRunPlan, dryRunPlanEvidenceSummary);

  const traces = buildStrategyDryRunTraces({
    readinessCheckpoint,
    dryRunPlan,
    dryRunPlanEvidenceSummary,
    generatedAt
  });
  const summary = buildStrategyDryRunNoOpSummary({
    readinessCheckpoint,
    dryRunPlan,
    dryRunPlanEvidenceSummary,
    traces,
    generatedAt
  });

  return { traces, summary };
}

async function assertValidInputs(root, readinessCheckpoint, dryRunPlan, dryRunPlanEvidenceSummary, strategyRunTraces, strategyNoopSummary) {
  const readinessReport = await validateStrategyDryRunReadinessCheckpoint(readinessCheckpoint, { repoRoot: root });
  const planReport = await validateStrategyDryRunPlan(dryRunPlan, { repoRoot: root });
  const evidenceSummaryReport = await validateStrategyDryRunPlanEvidenceSummary(dryRunPlanEvidenceSummary, { repoRoot: root });
  const runTraceReport = await validateStrategyRunTraces(strategyRunTraces, { repoRoot: root });
  const noopSummaryReport = validateStrategyNoopRunSummary(strategyNoopSummary);
  const errors = [
    ...readinessReport.errors.map((error) => `strategy_dry_run_readiness_checkpoint: ${error}`),
    ...planReport.errors.map((error) => `strategy_dry_run_plan: ${error}`),
    ...evidenceSummaryReport.errors.map((error) => `strategy_dry_run_plan_evidence_summary: ${error}`),
    ...runTraceReport.errors.map((error) => `strategy_run_trace: ${error}`),
    ...noopSummaryReport.errors.map((error) => `strategy_noop_run_summary: ${error}`)
  ];

  if (errors.length > 0) {
    throw new Error(`No-op strategy dry-run inputs are invalid:\n${errors.join("\n")}`);
  }
}

function assertReadyCheckpoint(readinessCheckpoint) {
  if (readinessCheckpoint.readiness_status !== "dry_run_ready") {
    throw new Error("StrategyDryRunReadinessCheckpoint is not dry_run_ready");
  }
  if (readinessCheckpoint.status !== "dry_run_readiness_checkpoint_ready") {
    throw new Error("StrategyDryRunReadinessCheckpoint is not ready");
  }
}

function assertLinkedInputs(readinessCheckpoint, dryRunPlan, dryRunPlanEvidenceSummary) {
  if (readinessCheckpoint.strategy_dry_run_plan_id !== dryRunPlan.strategy_dry_run_plan_id) {
    throw new Error("StrategyDryRunReadinessCheckpoint does not reference the supplied StrategyDryRunPlan");
  }
  if (readinessCheckpoint.strategy_dry_run_plan_evidence_summary_id !== dryRunPlanEvidenceSummary.strategy_dry_run_plan_evidence_summary_id) {
    throw new Error("StrategyDryRunReadinessCheckpoint does not reference the supplied StrategyDryRunPlanEvidenceSummary");
  }
  if (dryRunPlan.strategy_dry_run_plan_id !== dryRunPlanEvidenceSummary.strategy_dry_run_plan_id) {
    throw new Error("StrategyDryRunPlanEvidenceSummary does not reference the supplied StrategyDryRunPlan");
  }
}

async function readJson(root, repoPath) {
  return JSON.parse(await readFile(path.join(root, repoPath), "utf8"));
}

function parseJsonl(content) {
  return content
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const result = await runStrategyDryRunNoop();
  console.log("Overlord No-Op Strategy Dry Run");
  console.log(`trace_records: ${result.traces.length}`);
  console.log(`summary_status: ${result.summary.status}`);
}
