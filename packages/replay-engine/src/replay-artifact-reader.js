import path from "node:path";
import { readFile, stat } from "node:fs/promises";

const forbiddenPathPattern = /(^|[\\/])(\.env|env|credentials?|secrets?|api[_-]?keys?|live[_-]?config|tokens?|bearer|private[_-]?keys?)([\\/]|\.|$)/i;

export async function readManifestArtifacts(manifest, options = {}) {
  const repoRoot = options.repoRoot ?? path.resolve(import.meta.dirname, "..", "..", "..");
  const reads = [];

  for (const artifact of manifest.artifacts ?? []) {
    const resolved = await resolveLocalArtifactPath(repoRoot, artifact.artifact_path);
    const records = await readArtifactRecords(resolved, artifact.artifact_path);
    reads.push({
      artifact,
      records
    });
  }

  return reads;
}

export async function readArtifactRecords(resolvedPath, artifactPath) {
  const content = await readFile(resolvedPath, "utf8");
  if (artifactPath.endsWith(".jsonl")) {
    return content
      .split(/\r?\n/u)
      .filter((line) => line.trim().length > 0)
      .map((line, index) => ({
        record_ref: `${artifactPath}#L${index + 1}`,
        line_number: index + 1,
        record: JSON.parse(line)
      }));
  }

  if (artifactPath.endsWith(".json")) {
    return [{
      record_ref: `${artifactPath}#json`,
      line_number: null,
      record: JSON.parse(content)
    }];
  }

  throw new Error(`artifact_path must reference a JSON or JSONL fixture: ${artifactPath}`);
}

export async function resolveLocalArtifactPath(repoRoot, artifactPath) {
  if (typeof artifactPath !== "string" || artifactPath.length === 0) {
    throw new Error("artifact_path must be a non-empty string");
  }
  if (path.isAbsolute(artifactPath)) {
    throw new Error("artifact_path must be relative to repo root");
  }
  if (artifactPath.includes("..")) {
    throw new Error("artifact_path must not escape the repo");
  }
  if (forbiddenPathPattern.test(artifactPath)) {
    throw new Error("artifact_path must not reference credentials, env files, secrets, live configs, API keys, or tokens");
  }

  const resolved = path.resolve(repoRoot, artifactPath);
  if (!resolved.startsWith(repoRoot + path.sep) && resolved !== repoRoot) {
    throw new Error("artifact_path must stay inside repo root");
  }
  await stat(resolved);
  return resolved;
}

export function extractRecordId(record) {
  return record.event_id
    ?? record.state_id
    ?? record.signal_id
    ?? record.risk_decision_id
    ?? record.action_decision_id
    ?? record.paper_ledger_entry_id
    ?? record.paper_exit_id
    ?? record.paper_performance_summary_id
    ?? null;
}

export function extractRecordTime(record, fallbackGeneratedAt) {
  return record.received_at ?? record.generated_at ?? fallbackGeneratedAt;
}
