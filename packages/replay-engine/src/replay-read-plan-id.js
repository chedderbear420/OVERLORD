import { createHash } from "node:crypto";

export function replayReadPlanId(sourceReplayRunManifestId, artifactReads) {
  const artifactPart = artifactReads
    .map((read) => `${read.read_index}:${read.artifact_type}:${read.artifact_path}:${read.record_count}`)
    .join("__");
  return `rrp_${digest(`${sourceReplayRunManifestId}:${artifactPart}`)}`;
}

function digest(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 32);
}
