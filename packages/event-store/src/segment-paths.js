import path from "node:path";

export function segmentFileName({ source, capturedAt }) {
  const date = timestampDate(capturedAt);
  return `${sanitizeSegmentPart(source)}-${date}.jsonl`;
}

export function segmentPath(rootDir, options) {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedPath = path.resolve(resolvedRoot, segmentFileName(options));

  if (!resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error("segment path must stay inside the segment root");
  }

  return resolvedPath;
}

function timestampDate(timestamp) {
  if (typeof timestamp !== "string" || !timestamp.includes("T")) {
    throw new Error("capturedAt must be an RFC 3339 timestamp");
  }

  return timestamp.slice(0, 10);
}

function sanitizeSegmentPart(value) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("segment source must be a non-empty string");
  }

  return value.replace(/[^A-Za-z0-9._-]/g, "_");
}
