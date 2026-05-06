import path from "node:path";
import { readFile } from "node:fs/promises";
import { replayEvidenceBundleId } from "./replay-evidence-bundle-id.js";

export const defaultReplayEvidencePaths = {
  manifestPath: "packages/replay-engine/fixtures/synthetic_replay_run_manifest.json",
  clockPath: "packages/replay-engine/fixtures/synthetic_replay_clock.json",
  readPlanPath: "packages/replay-engine/fixtures/synthetic_replay_read_plan.json",
  tracePath: "packages/replay-engine/fixtures/synthetic_replay_trace.jsonl",
  summaryPath: "packages/replay-engine/fixtures/synthetic_replay_noop_run_summary.json"
};

const evidenceArtifactContracts = [
  {
    artifact_type: "replay_run_manifest",
    pathKey: "manifestPath",
    schema_version: "replay_run_manifest.v1",
    validation_command: "npm run validate:replay-run-manifest",
    id_field: "replay_run_manifest_id"
  },
  {
    artifact_type: "replay_clock",
    pathKey: "clockPath",
    schema_version: "replay_clock.v1",
    validation_command: "npm run validate:replay-clock",
    id_field: "replay_clock_id"
  },
  {
    artifact_type: "replay_read_plan",
    pathKey: "readPlanPath",
    schema_version: "replay_read_plan.v1",
    validation_command: "npm run validate:replay-read-plan",
    id_field: "replay_read_plan_id"
  },
  {
    artifact_type: "replay_trace",
    pathKey: "tracePath",
    schema_version: "replay_trace.v1",
    validation_command: "npm run validate:replay-trace",
    id_field: null
  },
  {
    artifact_type: "replay_noop_run_summary",
    pathKey: "summaryPath",
    schema_version: "replay_noop_run_summary.v1",
    validation_command: "npm run validate:replay-noop-run-summary",
    id_field: "replay_noop_run_summary_id"
  }
];

export async function buildReplayEvidenceBundle(options = {}) {
  const repoRoot = options.repoRoot ?? path.resolve(import.meta.dirname, "..", "..", "..");
  const generatedAt = options.generatedAt ?? "2026-04-28T14:05:01Z";
  const paths = { ...defaultReplayEvidencePaths, ...options.paths };
  const manifest = options.manifest ?? await readJson(repoRoot, paths.manifestPath);
  const clock = options.clock ?? await readJson(repoRoot, paths.clockPath);
  const readPlan = options.readPlan ?? await readJson(repoRoot, paths.readPlanPath);
  const traces = options.traces ?? await readJsonl(repoRoot, paths.tracePath);
  const summary = options.summary ?? await readJson(repoRoot, paths.summaryPath);
  const evidenceArtifacts = evidenceArtifactContracts.map((contract) => makeEvidenceArtifact(contract, paths, {
    manifest,
    clock,
    readPlan,
    traces,
    summary
  }));
  const consistencyChecks = buildReplayEvidenceConsistencyChecks({ manifest, clock, readPlan, traces, summary, evidenceArtifacts });

  return {
    replay_evidence_bundle_id: replayEvidenceBundleId({
      manifestId: manifest.replay_run_manifest_id,
      clockId: clock.replay_clock_id,
      readPlanId: readPlan.replay_read_plan_id,
      traceCount: traces.length,
      summaryId: summary.replay_noop_run_summary_id
    }),
    schema_version: "replay_evidence_bundle.v1",
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    replay_mode: "offline_fixture_replay",
    source_replay_run_manifest_id: manifest.replay_run_manifest_id,
    source_replay_clock_id: clock.replay_clock_id,
    source_replay_read_plan_id: readPlan.replay_read_plan_id,
    source_replay_noop_run_summary_id: summary.replay_noop_run_summary_id,
    source_manifest_path: paths.manifestPath,
    source_clock_path: paths.clockPath,
    source_read_plan_path: paths.readPlanPath,
    source_trace_path: paths.tracePath,
    source_summary_path: paths.summaryPath,
    evidence_artifacts: evidenceArtifacts,
    noop_run_totals: {
      total_trace_records: summary.total_trace_records,
      total_records_read: summary.total_records_read,
      total_artifacts_read: summary.total_artifacts_read
    },
    consistency_checks: consistencyChecks,
    status: consistencyChecks.every((check) => check.status === "check_passed") ? "evidence_bundle_ready" : "evidence_bundle_rejected",
    reason: "Replay evidence bundle for a local no-op replay run only. No strategy logic, decisions, trades, or analytics produced."
  };
}

export function buildReplayEvidenceConsistencyChecks({ manifest, clock, readPlan, traces, summary, evidenceArtifacts }) {
  return [
    makeCheck("manifest_matches_clock", clock.source_replay_run_manifest_id === manifest.replay_run_manifest_id),
    makeCheck("manifest_matches_read_plan", readPlan.source_replay_run_manifest_id === manifest.replay_run_manifest_id),
    makeCheck("manifest_matches_trace", traces.every((trace) => trace.source_replay_run_manifest_id === manifest.replay_run_manifest_id)),
    makeCheck("manifest_matches_summary", summary.source_replay_run_manifest_id === manifest.replay_run_manifest_id),
    makeCheck("clock_matches_trace", traces.every((trace) => trace.source_replay_clock_id === clock.replay_clock_id)),
    makeCheck("read_plan_matches_trace", traces.every((trace) => trace.source_replay_read_plan_id === readPlan.replay_read_plan_id)),
    makeCheck("summary_matches_clock", summary.source_replay_clock_id === clock.replay_clock_id),
    makeCheck("summary_matches_read_plan", summary.source_replay_read_plan_id === readPlan.replay_read_plan_id),
    makeCheck("trace_count_matches_summary", traces.length === summary.total_trace_records),
    makeCheck("records_read_matches_trace", traces.filter((trace) => trace.trace_event_type === "noop_record_read").length === summary.total_records_read),
    makeCheck("artifacts_read_matches_read_plan", readPlan.artifact_reads.length === summary.total_artifacts_read),
    makeCheck("evidence_artifact_count_matches_contract", evidenceArtifacts.length === evidenceArtifactContracts.length)
  ];
}

function makeEvidenceArtifact(contract, paths, sources) {
  const source = sources[sourceKey(contract.artifact_type)];
  return {
    artifact_type: contract.artifact_type,
    artifact_path: paths[contract.pathKey],
    schema_version: contract.schema_version,
    record_count: contract.artifact_type === "replay_trace" ? sources.traces.length : 1,
    validation_command: contract.validation_command,
    artifact_id: contract.id_field ? source[contract.id_field] : null
  };
}

function sourceKey(artifactType) {
  return {
    replay_run_manifest: "manifest",
    replay_clock: "clock",
    replay_read_plan: "readPlan",
    replay_noop_run_summary: "summary"
  }[artifactType];
}

function makeCheck(checkName, passed) {
  return {
    check_name: checkName,
    status: passed ? "check_passed" : "check_failed",
    reason: passed ? `${checkName} passed.` : `${checkName} failed.`
  };
}

async function readJson(repoRoot, repoPath) {
  return JSON.parse(await readFile(path.join(repoRoot, repoPath), "utf8"));
}

async function readJsonl(repoRoot, repoPath) {
  return (await readFile(path.join(repoRoot, repoPath), "utf8"))
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}
