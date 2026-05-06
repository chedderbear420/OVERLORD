import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, stat } from "node:fs/promises";
import { replayRunManifestId } from "./replay-run-manifest-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "replay-engine", "fixtures", "synthetic_replay_run_manifest.json");

const requiredFields = [
  "replay_run_manifest_id",
  "schema_version",
  "generated_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "replay_mode",
  "artifacts",
  "validation_commands",
  "status",
  "reason"
];
const requiredArtifactFields = ["artifact_type", "artifact_path", "schema_version", "record_count", "validation_command"];
const forbiddenPathPattern = /(^|[\\/])(\.env|env|credentials?|secrets?|api[_-]?keys?|live[_-]?config)([\\/]|\.|$)/i;

export async function validateReplayRunManifestFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let manifest;
  try {
    manifest = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, (await validateReplayRunManifest(manifest, options)).errors);
}

export async function validateReplayRunManifest(manifest, options = {}) {
  const errors = [];
  const root = options.repoRoot ?? repoRoot;

  for (const field of requiredFields) {
    if (!Object.hasOwn(manifest, field)) {
      errors.push(`${field} is required`);
    }
  }
  if (manifest.schema_version !== "replay_run_manifest.v1") {
    errors.push("schema_version must be replay_run_manifest.v1");
  }
  if (Number.isNaN(Date.parse(manifest.generated_at))) {
    errors.push("generated_at must be a valid timestamp");
  }
  if (manifest.paper_only !== true) {
    errors.push("paper_only must be true");
  }
  if (manifest.live_execution_allowed !== false) {
    errors.push("live_execution_allowed must be false");
  }
  if (manifest.order_placement_allowed !== false) {
    errors.push("order_placement_allowed must be false");
  }
  if (manifest.replay_mode !== "offline_fixture_replay") {
    errors.push("replay_mode is invalid");
  }
  if (!["manifest_ready", "manifest_rejected"].includes(manifest.status)) {
    errors.push("status is invalid");
  }
  if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length === 0) {
    errors.push("artifacts must be a non-empty array");
  }
  if (!Array.isArray(manifest.validation_commands) || manifest.validation_commands.length === 0) {
    errors.push("validation_commands must be a non-empty array");
  }

  const artifacts = Array.isArray(manifest.artifacts) ? manifest.artifacts : [];
  if (manifest.replay_run_manifest_id !== replayRunManifestId(manifest.generated_at, artifacts)) {
    errors.push("replay_run_manifest_id must be deterministic from generated_at and artifact paths");
  }

  for (const artifact of artifacts) {
    await validateArtifact(errors, root, artifact);
  }

  return { ok: errors.length === 0, errors };
}

export function formatReplayRunManifestValidationReport(report) {
  const lines = [
    "Overlord ReplayRunManifest Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) {
    lines.push(`ERROR ${error}`);
  }
  return lines.join("\n");
}

async function validateArtifact(errors, root, artifact) {
  for (const field of requiredArtifactFields) {
    if (!Object.hasOwn(artifact, field)) {
      errors.push(`artifact ${field} is required`);
    }
  }
  if (!Number.isInteger(artifact.record_count) || artifact.record_count < 0) {
    errors.push("artifact record_count must be a non-negative integer");
  }
  if (typeof artifact.validation_command !== "string" || !artifact.validation_command.startsWith("npm run ")) {
    errors.push("artifact validation_command must be a local npm script");
  }
  await validateArtifactPath(errors, root, artifact.artifact_path);
}

async function validateArtifactPath(errors, root, artifactPath) {
  if (typeof artifactPath !== "string" || artifactPath.length === 0) {
    errors.push("artifact_path must be a non-empty string");
    return;
  }
  if (path.isAbsolute(artifactPath)) {
    errors.push("artifact_path must be relative to repo root");
  }
  if (artifactPath.includes("..")) {
    errors.push("artifact_path must not escape the repo");
  }
  if (forbiddenPathPattern.test(artifactPath)) {
    errors.push("artifact_path must not reference credentials, env files, secrets, live configs, or API keys");
  }
  const resolved = path.resolve(root, artifactPath);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    errors.push("artifact_path must stay inside repo root");
    return;
  }
  try {
    await stat(resolved);
  } catch {
    errors.push(`artifact_path does not exist locally: ${artifactPath}`);
  }
}

function makeReport(filePath, errors) {
  return {
    ok: errors.length === 0,
    filePath: path.relative(repoRoot, filePath).replaceAll("\\", "/"),
    errors
  };
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const explicitPath = process.argv.find((arg) => arg.endsWith(".json"));
  const report = await validateReplayRunManifestFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatReplayRunManifestValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
