export function replayRunManifestId(generatedAt, artifacts) {
  const artifactPart = artifacts.map((artifact) => artifact.artifact_path).join("__");
  return `rrm_${sanitize(generatedAt)}_${sanitize(artifactPart)}`;
}

function sanitize(value) {
  return String(value ?? "unknown").replace(/[^A-Za-z0-9._:-]/g, "_");
}
