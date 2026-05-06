import path from "node:path";
import { readFile } from "node:fs/promises";
import { readManifestArtifacts } from "./replay-artifact-reader.js";
import { replayReadPlanId } from "./replay-read-plan-id.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const defaultManifestPath = "packages/replay-engine/fixtures/synthetic_replay_run_manifest.json";

export async function buildReplayReadPlan(options = {}) {
  const root = options.repoRoot ?? repoRoot;
  const sourceManifestPath = normalizeRepoPath(options.sourceManifestPath ?? defaultManifestPath);
  const manifest = options.manifest ?? JSON.parse(await readFile(path.join(root, sourceManifestPath), "utf8"));
  const generatedAt = options.generatedAt ?? manifest.generated_at;
  const artifactReads = await readManifestArtifacts(manifest, { repoRoot: root });

  const reads = artifactReads.map(({ artifact, records }, index) => ({
    read_index: index,
    artifact_type: artifact.artifact_type,
    artifact_path: artifact.artifact_path,
    record_count: records.length,
    validation_command: artifact.validation_command
  }));

  return {
    replay_read_plan_id: replayReadPlanId(manifest.replay_run_manifest_id, reads),
    schema_version: "replay_read_plan.v1",
    source_replay_run_manifest_id: manifest.replay_run_manifest_id,
    source_manifest_path: sourceManifestPath,
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    replay_mode: manifest.replay_mode,
    artifact_reads: reads,
    total_records_planned: reads.reduce((total, read) => total + read.record_count, 0),
    status: "replay_read_plan_ready",
    reason: "Deterministic local fixture read plan only; no replay logic executed."
  };
}

function normalizeRepoPath(value) {
  return String(value).replaceAll("\\", "/");
}
