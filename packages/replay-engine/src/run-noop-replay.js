import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { buildReplayNoopRunSummary, buildReplayTraceRecords } from "./build-replay-trace.js";
import { readManifestArtifacts } from "./replay-artifact-reader.js";
import { validateReplayClock } from "./validate-replay-clock.js";
import { validateReplayReadPlan } from "./validate-replay-read-plan.js";
import { validateReplayRunManifest } from "./validate-replay-run-manifest.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultManifestPath = "packages/replay-engine/fixtures/synthetic_replay_run_manifest.json";
const defaultClockPath = "packages/replay-engine/fixtures/synthetic_replay_clock.json";
const defaultReadPlanPath = "packages/replay-engine/fixtures/synthetic_replay_read_plan.json";

export async function runNoopReplay(options = {}) {
  const root = options.repoRoot ?? repoRoot;
  const manifestPath = normalizeRepoPath(options.manifestPath ?? defaultManifestPath);
  const clockPath = normalizeRepoPath(options.clockPath ?? defaultClockPath);
  const readPlanPath = normalizeRepoPath(options.readPlanPath ?? defaultReadPlanPath);
  const manifest = options.manifest ?? await readJson(root, manifestPath);
  const clock = options.clock ?? await readJson(root, clockPath);
  const readPlan = options.readPlan ?? await readJson(root, readPlanPath);
  const generatedAt = options.generatedAt ?? clock.generated_at;

  await assertValidInputs(root, manifest, clock, readPlan);
  await verifyReplayWalkReferences(root, manifest, clock, readPlan);

  const traces = buildReplayTraceRecords({ manifest, clock, readPlan, generatedAt });
  const summary = buildReplayNoopRunSummary({ manifest, clock, readPlan, traces, generatedAt });

  return {
    traces,
    summary
  };
}

async function assertValidInputs(root, manifest, clock, readPlan) {
  const manifestReport = await validateReplayRunManifest(manifest, { repoRoot: root });
  const clockReport = await validateReplayClock(clock, { repoRoot: root });
  const readPlanReport = await validateReplayReadPlan(readPlan, { repoRoot: root });
  const errors = [
    ...manifestReport.errors.map((error) => `manifest: ${error}`),
    ...clockReport.errors.map((error) => `clock: ${error}`),
    ...readPlanReport.errors.map((error) => `read_plan: ${error}`)
  ];

  if (errors.length > 0) {
    throw new Error(`No-op replay inputs are invalid:\n${errors.join("\n")}`);
  }

  if (clock.source_replay_run_manifest_id !== manifest.replay_run_manifest_id) {
    throw new Error("ReplayClock does not reference the supplied ReplayRunManifest");
  }
  if (readPlan.source_replay_run_manifest_id !== manifest.replay_run_manifest_id) {
    throw new Error("ReplayReadPlan does not reference the supplied ReplayRunManifest");
  }
}

async function verifyReplayWalkReferences(root, manifest, clock, readPlan) {
  const plannedReads = new Map(readPlan.artifact_reads.map((read) => [read.artifact_path, read]));
  const manifestRecords = await readManifestArtifacts(manifest, { repoRoot: root });
  const recordRefs = new Set();

  for (const { artifact, records } of manifestRecords) {
    const plannedRead = plannedReads.get(artifact.artifact_path);
    if (!plannedRead) {
      throw new Error(`Clock artifact is not present in ReplayReadPlan: ${artifact.artifact_path}`);
    }
    if (plannedRead.record_count !== records.length) {
      throw new Error(`ReplayReadPlan record_count does not match local artifact: ${artifact.artifact_path}`);
    }
    for (const entry of records) {
      recordRefs.add(entry.record_ref);
    }
  }

  for (const clockEvent of clock.clock_events) {
    const plannedRead = plannedReads.get(clockEvent.artifact_path);
    if (!plannedRead) {
      throw new Error(`Clock event artifact is not present in ReplayReadPlan: ${clockEvent.artifact_path}`);
    }
    if (!recordRefs.has(clockEvent.record_ref)) {
      throw new Error(`Clock event record_ref is not present in local fixture artifacts: ${clockEvent.record_ref}`);
    }
  }
}

async function readJson(root, repoPath) {
  return JSON.parse(await readFile(path.join(root, repoPath), "utf8"));
}

function normalizeRepoPath(value) {
  return String(value).replaceAll("\\", "/");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const result = await runNoopReplay();
  console.log(`Overlord No-Op Replay`);
  console.log(`trace_records: ${result.traces.length}`);
  console.log(`summary_status: ${result.summary.status}`);
}
