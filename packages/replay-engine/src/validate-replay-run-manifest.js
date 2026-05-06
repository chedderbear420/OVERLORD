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
const forbiddenPathPattern = /(^|[\\/])(\.env|env|credentials?|secrets?|api[_-]?keys?|live[_-]?config|tokens?|bearer|private[_-]?keys?)([\\/]|\.|$)/i;
const forbiddenCommandPattern = /\b(curl|wget|fetch|powershell|pwsh|invoke-webrequest|invoke-restmethod|iwr|irm)\b|https?:\/\/|[|<>]/i;
const forbiddenManifestFields = new Set([
  "strategy_score",
  "strategy_name",
  "bankroll_growth",
  "bankroll_allocation",
  "roi",
  "sharpe_ratio",
  "kelly_fraction",
  "model_score",
  "recommendation",
  "recommended_action",
  "live_trade_recommendation"
]);
const artifactContracts = new Map([
  ["event_store_market_events", {
    artifact_path: "packages/event-store/fixtures/synthetic_market_events.jsonl",
    schema_version: "event_envelope.v1",
    validation_command: "npm run validate:event-store"
  }],
  ["market_state", {
    artifact_path: "packages/market-state-engine/fixtures/synthetic_market_states.jsonl",
    schema_version: "market_state.v1",
    validation_command: "npm run validate:market-state"
  }],
  ["edge_signal", {
    artifact_path: "packages/edge-scanner/fixtures/synthetic_edge_signals.jsonl",
    schema_version: "edge_signal.v1",
    validation_command: "npm run validate:edge-signals"
  }],
  ["risk_decision", {
    artifact_path: "packages/risk-governor/fixtures/synthetic_risk_decisions.jsonl",
    schema_version: "risk_decision.v1",
    validation_command: "npm run validate:risk-decisions"
  }],
  ["action_decision", {
    artifact_path: "packages/risk-governor/fixtures/synthetic_action_decisions.jsonl",
    schema_version: "action_decision.v1",
    validation_command: "npm run validate:action-decisions"
  }],
  ["paper_ledger", {
    artifact_path: "packages/paper-trader/fixtures/synthetic_paper_ledger_entries.jsonl",
    schema_version: "paper_ledger_entry.v1",
    validation_command: "npm run validate:paper-ledger"
  }],
  ["paper_exit", {
    artifact_path: "packages/paper-trader/fixtures/synthetic_paper_exits.jsonl",
    schema_version: "paper_exit.v1",
    validation_command: "npm run validate:paper-exits"
  }],
  ["paper_performance_summary", {
    artifact_path: "packages/paper-trader/fixtures/synthetic_paper_performance_summary.json",
    schema_version: "paper_performance_summary.v1",
    validation_command: "npm run validate:paper-performance-summary"
  }]
]);

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

  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return { ok: false, errors: ["manifest must be a JSON object"] };
  }

  validateForbiddenFields(errors, manifest);

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

  const seenArtifactPaths = new Set();
  for (const artifact of artifacts) {
    await validateArtifact(errors, root, artifact, seenArtifactPaths);
  }

  if (Array.isArray(manifest.validation_commands)) {
    validateManifestValidationCommands(errors, manifest.validation_commands, artifacts);
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

async function validateArtifact(errors, root, artifact, seenArtifactPaths) {
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
    errors.push("artifact must be an object");
    return;
  }
  for (const field of requiredArtifactFields) {
    if (!Object.hasOwn(artifact, field)) {
      errors.push(`artifact ${field} is required`);
    }
  }
  if (!artifactContracts.has(artifact.artifact_type)) {
    errors.push("artifact_type is invalid");
  } else {
    const contract = artifactContracts.get(artifact.artifact_type);
    if (artifact.artifact_path !== contract.artifact_path) {
      errors.push("artifact_path must match the known artifact contract");
    }
    if (artifact.schema_version !== contract.schema_version) {
      errors.push("artifact schema_version must match the known artifact contract");
    }
    if (artifact.validation_command !== contract.validation_command) {
      errors.push("artifact validation_command must match the known artifact contract");
    }
  }
  if (typeof artifact.artifact_path === "string") {
    if (seenArtifactPaths.has(artifact.artifact_path)) {
      errors.push("duplicate artifact reference is not allowed");
    }
    seenArtifactPaths.add(artifact.artifact_path);
  }
  if (!Number.isInteger(artifact.record_count) || artifact.record_count < 0) {
    errors.push("artifact record_count must be a non-negative integer");
  }
  if (!isSafeLocalNpmCommand(artifact.validation_command)) {
    errors.push("artifact validation_command must be a local npm script");
  }
  const resolved = await validateArtifactPath(errors, root, artifact.artifact_path);
  if (resolved && Number.isInteger(artifact.record_count) && artifact.record_count >= 0) {
    const actualRecordCount = await countArtifactRecords(errors, resolved, artifact.artifact_path);
    if (actualRecordCount !== null && artifact.record_count !== actualRecordCount) {
      errors.push(`artifact record_count must match local file count for ${artifact.artifact_path}`);
    }
  }
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
    errors.push("artifact_path must not reference credentials, env files, secrets, live configs, API keys, or tokens");
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
    return null;
  }
  return resolved;
}

async function countArtifactRecords(errors, resolved, artifactPath) {
  try {
    const content = await readFile(resolved, "utf8");
    if (artifactPath.endsWith(".jsonl")) {
      return content.split(/\r?\n/u).filter((line) => line.trim().length > 0).length;
    }
    if (artifactPath.endsWith(".json")) {
      JSON.parse(content);
      return 1;
    }
    errors.push(`artifact_path must reference a JSON or JSONL fixture: ${artifactPath}`);
    return null;
  } catch (error) {
    errors.push(`artifact record_count could not be verified for ${artifactPath}: ${error.message}`);
    return null;
  }
}

function validateManifestValidationCommands(errors, validationCommands, artifacts) {
  const expectedCommands = [...new Set(artifacts.map((artifact) => artifact.validation_command))];
  if (validationCommands.length !== expectedCommands.length) {
    errors.push("validation_commands must match artifact validation commands in deterministic order");
  }
  validationCommands.forEach((command, index) => {
    if (!isSafeLocalNpmCommand(command)) {
      errors.push("validation_commands must contain local npm scripts only");
    }
    if (command !== expectedCommands[index]) {
      errors.push("validation_commands must match artifact validation commands in deterministic order");
    }
  });
}

function isSafeLocalNpmCommand(command) {
  return typeof command === "string" && command.startsWith("npm run ") && !forbiddenCommandPattern.test(command);
}

function validateForbiddenFields(errors, value, pathParts = []) {
  if (!value || typeof value !== "object") {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => validateForbiddenFields(errors, entry, [...pathParts, String(index)]));
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenManifestFields.has(key)) {
      const fieldPath = [...pathParts, key].join(".");
      errors.push(`forbidden strategy, bankroll, model, or recommendation field is not allowed: ${fieldPath}`);
    }
    validateForbiddenFields(errors, nested, [...pathParts, key]);
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
