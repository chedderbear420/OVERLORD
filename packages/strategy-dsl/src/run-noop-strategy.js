import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { buildStrategyNoopRunSummary, buildStrategyRunTraces } from "./build-strategy-run-trace.js";
import { validateStrategyDefinition } from "./validate-strategy-definition.js";
import { validateStrategyRunIntent } from "./validate-strategy-run-intent.js";
import { validateReplayEvidenceBundle } from "../../replay-engine/src/validate-replay-evidence-bundle.js";
import { validateReplayRunReport } from "../../replay-engine/src/validate-replay-run-report.js";
import { validateReplayTraces } from "../../replay-engine/src/validate-replay-trace.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultStrategyDefinitionPath = "packages/strategy-dsl/fixtures/synthetic_strategy_definition.json";
const defaultStrategyRunIntentPath = "packages/strategy-dsl/fixtures/synthetic_strategy_run_intent.json";
const defaultReplayEvidenceBundlePath = "packages/replay-engine/fixtures/synthetic_replay_evidence_bundle.json";
const defaultReplayRunReportPath = "packages/replay-engine/fixtures/synthetic_replay_run_report.json";
const defaultReplayTracePath = "packages/replay-engine/fixtures/synthetic_replay_trace.jsonl";

export async function runNoopStrategy(options = {}) {
  const root = options.repoRoot ?? repoRoot;
  const strategyDefinition = options.strategyDefinition
    ?? await readJson(root, normalizeRepoPath(options.strategyDefinitionPath ?? defaultStrategyDefinitionPath));
  const strategyRunIntent = options.strategyRunIntent
    ?? await readJson(root, normalizeRepoPath(options.strategyRunIntentPath ?? defaultStrategyRunIntentPath));
  const replayEvidenceBundle = options.replayEvidenceBundle
    ?? await readJson(root, normalizeRepoPath(options.replayEvidenceBundlePath ?? defaultReplayEvidenceBundlePath));
  const replayRunReport = options.replayRunReport
    ?? await readJson(root, normalizeRepoPath(options.replayRunReportPath ?? defaultReplayRunReportPath));
  const replayTraces = options.replayTraces
    ?? parseJsonl(await readFile(path.join(root, normalizeRepoPath(options.replayTracePath ?? defaultReplayTracePath)), "utf8"));
  const generatedAt = options.generatedAt ?? replayEvidenceBundle.generated_at;

  await assertValidInputs(root, strategyDefinition, strategyRunIntent, replayEvidenceBundle, replayRunReport, replayTraces);
  assertLinkedInputs(strategyDefinition, strategyRunIntent, replayEvidenceBundle, replayRunReport);

  const traces = buildStrategyRunTraces({
    strategyDefinition,
    strategyRunIntent,
    replayEvidenceBundle,
    replayTraces,
    generatedAt
  });
  const summary = buildStrategyNoopRunSummary({
    strategyDefinition,
    strategyRunIntent,
    replayEvidenceBundle,
    traces,
    generatedAt
  });

  return { traces, summary };
}

async function assertValidInputs(root, strategyDefinition, strategyRunIntent, replayEvidenceBundle, replayRunReport, replayTraces) {
  const definitionReport = validateStrategyDefinition(strategyDefinition);
  const intentReport = validateStrategyRunIntent(strategyRunIntent);
  const evidenceReport = await validateReplayEvidenceBundle(replayEvidenceBundle, { repoRoot: root });
  const runReport = validateReplayRunReport(replayRunReport);
  const replayTraceReport = await validateReplayTraces(replayTraces, { repoRoot: root });
  const errors = [
    ...definitionReport.errors.map((error) => `strategy_definition: ${error}`),
    ...intentReport.errors.map((error) => `strategy_run_intent: ${error}`),
    ...evidenceReport.errors.map((error) => `replay_evidence_bundle: ${error}`),
    ...runReport.errors.map((error) => `replay_run_report: ${error}`),
    ...replayTraceReport.errors.map((error) => `replay_trace: ${error}`)
  ];

  if (errors.length > 0) {
    throw new Error(`No-op strategy inputs are invalid:\n${errors.join("\n")}`);
  }
}

function assertLinkedInputs(strategyDefinition, strategyRunIntent, replayEvidenceBundle, replayRunReport) {
  if (strategyRunIntent.strategy_definition_id !== strategyDefinition.strategy_definition_id) {
    throw new Error("StrategyRunIntent does not reference the supplied StrategyDefinition");
  }
  if (strategyRunIntent.source_replay_evidence_bundle_id !== replayEvidenceBundle.replay_evidence_bundle_id) {
    throw new Error("StrategyRunIntent does not reference the supplied ReplayEvidenceBundle");
  }
  if (strategyRunIntent.source_replay_run_manifest_id !== replayEvidenceBundle.source_replay_run_manifest_id) {
    throw new Error("StrategyRunIntent does not reference the supplied ReplayRunManifest");
  }
  if (replayRunReport.source_replay_evidence_bundle_id !== replayEvidenceBundle.replay_evidence_bundle_id) {
    throw new Error("ReplayRunReport does not reference the supplied ReplayEvidenceBundle");
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

function normalizeRepoPath(value) {
  return String(value).replaceAll("\\", "/");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const result = await runNoopStrategy();
  console.log("Overlord No-Op Strategy");
  console.log(`trace_records: ${result.traces.length}`);
  console.log(`summary_status: ${result.summary.status}`);
}
