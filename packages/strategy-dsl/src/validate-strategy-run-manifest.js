import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { resolveLocalArtifactPath } from "../../replay-engine/src/replay-artifact-reader.js";
import { validateForbiddenFields } from "./strategy-contract-rules.js";
import { countStrategyArtifactRecords, strategyArtifactContracts } from "./strategy-run-artifacts.js";
import { strategyRunManifestId } from "./strategy-run-manifest-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_run_manifest.json");
const requiredFields = [
  "strategy_run_manifest_id",
  "schema_version",
  "generated_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "strategy_definition_id",
  "strategy_run_intent_id",
  "replay_mode",
  "run_mode",
  "artifacts",
  "validation_commands",
  "status",
  "reason"
];
const requiredArtifactFields = ["artifact_type", "artifact_path", "schema_version", "record_count", "validation_command"];
const allowedRunModes = new Set(["validation_only", "dry_run_planned"]);
const allowedStatuses = new Set(["strategy_run_manifest_ready", "strategy_run_manifest_rejected"]);
const contractByType = new Map(strategyArtifactContracts.map((contract) => [contract.artifact_type, contract]));
const forbiddenCommandPattern = /\b(curl|wget|fetch|powershell|pwsh|invoke-webrequest|invoke-restmethod|iwr|irm)\b|https?:\/\/|[|<>]/i;

export async function validateStrategyRunManifestFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let manifest;
  try {
    manifest = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, (await validateStrategyRunManifest(manifest, options)).errors);
}

export async function validateStrategyRunManifest(manifest, options = {}) {
  const errors = [];
  const root = options.repoRoot ?? repoRoot;

  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return { ok: false, errors: ["StrategyRunManifest must be a JSON object"] };
  }
  validateForbiddenFields(errors, manifest);
  for (const field of requiredFields) {
    if (!Object.hasOwn(manifest, field)) {
      errors.push(`${field} is required`);
    }
  }
  if (manifest.schema_version !== "strategy_run_manifest.v1") {
    errors.push("schema_version must be strategy_run_manifest.v1");
  }
  if (Number.isNaN(Date.parse(manifest.generated_at))) {
    errors.push("generated_at must be a valid timestamp");
  }
  validateSafetyAndModes(errors, manifest);
  if (typeof manifest.strategy_definition_id !== "string" || !manifest.strategy_definition_id.startsWith("sdef_")) {
    errors.push("strategy_definition_id must reference a StrategyDefinition id");
  }
  if (typeof manifest.strategy_run_intent_id !== "string" || !manifest.strategy_run_intent_id.startsWith("sri_")) {
    errors.push("strategy_run_intent_id must reference a StrategyRunIntent id");
  }
  const artifacts = Array.isArray(manifest.artifacts) ? manifest.artifacts : [];
  if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length === 0) {
    errors.push("artifacts must be a non-empty array");
  }
  if (!Array.isArray(manifest.validation_commands) || manifest.validation_commands.length === 0) {
    errors.push("validation_commands must be a non-empty array");
  }
  if (manifest.strategy_run_manifest_id !== strategyRunManifestId(manifest.generated_at, artifacts)) {
    errors.push("strategy_run_manifest_id must be deterministic from generated_at and artifact paths");
  }
  await validateArtifacts(errors, root, artifacts);
  validateValidationCommands(errors, manifest.validation_commands, artifacts);

  return { ok: errors.length === 0, errors };
}

export function formatStrategyRunManifestValidationReport(report) {
  const lines = [
    "Overlord StrategyRunManifest Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) {
    lines.push(`ERROR ${error}`);
  }
  return lines.join("\n");
}

function validateSafetyAndModes(errors, value) {
  if (value.paper_only !== true) errors.push("paper_only must be true");
  if (value.live_execution_allowed !== false) errors.push("live_execution_allowed must be false");
  if (value.order_placement_allowed !== false) errors.push("order_placement_allowed must be false");
  if (value.replay_mode !== "offline_fixture_replay") errors.push("replay_mode is invalid");
  if (!allowedRunModes.has(value.run_mode)) errors.push("run_mode is invalid");
  if (!allowedStatuses.has(value.status)) errors.push("status is invalid");
}

async function validateArtifacts(errors, root, artifacts) {
  const seenTypes = new Set();
  const seenPaths = new Set();
  for (const artifact of artifacts) {
    if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
      errors.push("artifact must be an object");
      continue;
    }
    for (const field of requiredArtifactFields) {
      if (!Object.hasOwn(artifact, field)) errors.push(`artifact ${field} is required`);
    }
    const contract = contractByType.get(artifact.artifact_type);
    if (!contract) {
      errors.push("artifact_type is invalid");
    } else {
      if (artifact.artifact_path !== contractByPathKey(contract)) errors.push("artifact_path must match the known strategy artifact contract");
      if (artifact.schema_version !== contract.schema_version) errors.push("artifact schema_version must match the known strategy artifact contract");
      if (artifact.validation_command !== contract.validation_command) errors.push("artifact validation_command must match the known strategy artifact contract");
    }
    if (seenTypes.has(artifact.artifact_type)) errors.push("duplicate artifact_type is not allowed");
    seenTypes.add(artifact.artifact_type);
    if (seenPaths.has(artifact.artifact_path)) errors.push("duplicate artifact_path is not allowed");
    seenPaths.add(artifact.artifact_path);
    if (!Number.isInteger(artifact.record_count) || artifact.record_count < 0) errors.push("artifact record_count must be a non-negative integer");
    if (!isSafeLocalNpmCommand(artifact.validation_command)) errors.push("artifact validation_command must be a local npm script");
    await validateSafePath(errors, root, artifact.artifact_path, "artifact_path");
    if (typeof artifact.artifact_path === "string" && Number.isInteger(artifact.record_count)) {
      try {
        const actual = await countStrategyArtifactRecords(root, artifact.artifact_path);
        if (actual !== artifact.record_count) errors.push("artifact record_count must match local fixture count");
      } catch (error) {
        errors.push(`artifact record_count could not be verified: ${error.message}`);
      }
    }
  }
  for (const contract of strategyArtifactContracts) {
    if (!seenTypes.has(contract.artifact_type)) errors.push(`missing required artifact_type: ${contract.artifact_type}`);
  }
}

function contractByPathKey(contract) {
  return {
    definitionPath: "packages/strategy-dsl/fixtures/synthetic_strategy_definition.json",
    intentPath: "packages/strategy-dsl/fixtures/synthetic_strategy_run_intent.json",
    tracePath: "packages/strategy-dsl/fixtures/synthetic_strategy_run_trace.jsonl",
    summaryPath: "packages/strategy-dsl/fixtures/synthetic_strategy_noop_run_summary.json"
  }[contract.pathKey];
}

function validateValidationCommands(errors, validationCommands, artifacts) {
  if (!Array.isArray(validationCommands)) return;
  const expected = [...new Set(artifacts.map((artifact) => artifact.validation_command))];
  if (validationCommands.length !== expected.length) errors.push("validation_commands must match artifact validation commands in deterministic order");
  validationCommands.forEach((command, index) => {
    if (!isSafeLocalNpmCommand(command)) errors.push("validation_commands must contain local npm scripts only");
    if (command !== expected[index]) errors.push("validation_commands must match artifact validation commands in deterministic order");
  });
}

async function validateSafePath(errors, root, artifactPath, label) {
  try {
    await resolveLocalArtifactPath(root, artifactPath);
  } catch (error) {
    errors.push(`${label} ${error.message}`);
  }
}

function isSafeLocalNpmCommand(command) {
  return typeof command === "string" && command.startsWith("npm run ") && !forbiddenCommandPattern.test(command);
}

function makeReport(filePath, errors) {
  return {
    ok: errors.length === 0,
    filePath: path.relative(repoRoot, filePath).replaceAll("\\", "/"),
    errors
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const explicitPath = process.argv.find((arg) => arg.endsWith(".json"));
  const report = await validateStrategyRunManifestFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatStrategyRunManifestValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
