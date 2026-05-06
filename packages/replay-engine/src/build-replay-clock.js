import path from "node:path";
import { readFile } from "node:fs/promises";
import { extractRecordId, extractRecordTime, readManifestArtifacts } from "./replay-artifact-reader.js";
import { replayClockId } from "./replay-clock-id.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const defaultManifestPath = "packages/replay-engine/fixtures/synthetic_replay_run_manifest.json";

export async function buildReplayClock(options = {}) {
  const root = options.repoRoot ?? repoRoot;
  const sourceManifestPath = normalizeRepoPath(options.sourceManifestPath ?? defaultManifestPath);
  const manifest = options.manifest ?? JSON.parse(await readFile(path.join(root, sourceManifestPath), "utf8"));
  const generatedAt = options.generatedAt ?? manifest.generated_at;
  const artifactReads = await readManifestArtifacts(manifest, { repoRoot: root });
  const clockEvents = [];

  for (const { artifact, records } of artifactReads) {
    for (const entry of records) {
      const recordTime = extractRecordTime(entry.record, generatedAt);
      clockEvents.push({
        artifact_type: artifact.artifact_type,
        artifact_path: artifact.artifact_path,
        record_ref: entry.record_ref,
        record_time: recordTime,
        record_id: extractRecordId(entry.record)
      });
    }
  }

  clockEvents.sort(compareClockEvents);
  clockEvents.forEach((event, index) => {
    event.clock_index = index;
  });

  return {
    replay_clock_id: replayClockId(manifest.replay_run_manifest_id, clockEvents),
    schema_version: "replay_clock.v1",
    source_replay_run_manifest_id: manifest.replay_run_manifest_id,
    source_manifest_path: sourceManifestPath,
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    replay_mode: manifest.replay_mode,
    clock_events: clockEvents,
    status: "replay_clock_ready",
    reason: "Deterministic read-order clock for local fake-data artifacts only; no replay logic executed."
  };
}

export function compareClockEvents(left, right) {
  return String(left.record_time).localeCompare(String(right.record_time))
    || left.artifact_type.localeCompare(right.artifact_type)
    || String(left.record_id ?? left.record_ref).localeCompare(String(right.record_id ?? right.record_ref));
}

function normalizeRepoPath(value) {
  return String(value).replaceAll("\\", "/");
}
