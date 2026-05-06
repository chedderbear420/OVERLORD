import path from "node:path";
import { readFile } from "node:fs/promises";
import { buildReplayEvidenceBundle } from "./build-replay-evidence-bundle.js";
import { replayRunReportId } from "./replay-run-report-id.js";

const defaultBundlePath = "packages/replay-engine/fixtures/synthetic_replay_evidence_bundle.json";

export async function buildReplayRunReport(options = {}) {
  const repoRoot = options.repoRoot ?? path.resolve(import.meta.dirname, "..", "..", "..");
  const generatedAt = options.generatedAt ?? "2026-04-28T14:05:01Z";
  const bundle = options.bundle ?? await readBundle(repoRoot, options.bundlePath ?? defaultBundlePath, generatedAt);
  const traceArtifact = bundle.evidence_artifacts.find((artifact) => artifact.artifact_type === "replay_trace");
  const consistencyStatus = bundle.consistency_checks.every((check) => check.status === "check_passed")
    ? "consistent"
    : "inconsistent";
  const totalTraceRecords = bundle.noop_run_totals?.total_trace_records ?? traceArtifact?.record_count ?? 0;
  const totalRecordsRead = bundle.noop_run_totals?.total_records_read ?? 0;
  const totalArtifactsRead = bundle.noop_run_totals?.total_artifacts_read ?? 0;

  return {
    replay_run_report_id: replayRunReportId({
      evidenceBundleId: bundle.replay_evidence_bundle_id,
      totalTraceRecords,
      totalRecordsRead,
      totalArtifactsRead
    }),
    schema_version: "replay_run_report.v1",
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    replay_mode: bundle.replay_mode,
    source_replay_evidence_bundle_id: bundle.replay_evidence_bundle_id,
    source_replay_run_manifest_id: bundle.source_replay_run_manifest_id,
    source_replay_clock_id: bundle.source_replay_clock_id,
    source_replay_read_plan_id: bundle.source_replay_read_plan_id,
    source_replay_noop_run_summary_id: bundle.source_replay_noop_run_summary_id,
    total_artifacts_verified: bundle.evidence_artifacts.length,
    total_trace_records: totalTraceRecords,
    total_records_read: totalRecordsRead,
    total_artifacts_read: totalArtifactsRead,
    consistency_status: consistencyStatus,
    status: consistencyStatus === "consistent" ? "replay_run_report_ready" : "replay_run_report_rejected",
    reason: "Read-only no-op replay report metadata. No strategy logic, decisions, trades, recommendations, or analytics produced."
  };
}

async function readBundle(repoRoot, bundlePath, generatedAt) {
  try {
    return JSON.parse(await readFile(path.join(repoRoot, bundlePath), "utf8"));
  } catch {
    return buildReplayEvidenceBundle({ repoRoot, generatedAt });
  }
}
