import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import {
  allowedReplayModes,
  allowedRunIntentStatuses,
  allowedRunModes,
  validateForbiddenFields
} from "./strategy-contract-rules.js";
import { strategyRunIntentId } from "./strategy-run-intent-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_run_intent.json");
const requiredFields = [
  "strategy_run_intent_id",
  "schema_version",
  "created_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "strategy_definition_id",
  "replay_mode",
  "source_replay_evidence_bundle_id",
  "source_replay_run_manifest_id",
  "run_mode",
  "status",
  "reason"
];

export async function validateStrategyRunIntentFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let intent;
  try {
    intent = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, validateStrategyRunIntent(intent).errors);
}

export function validateStrategyRunIntent(intent) {
  const errors = [];

  if (!intent || typeof intent !== "object" || Array.isArray(intent)) {
    return { ok: false, errors: ["StrategyRunIntent must be a JSON object"] };
  }
  validateForbiddenFields(errors, intent);
  for (const field of requiredFields) {
    if (!Object.hasOwn(intent, field)) {
      errors.push(`${field} is required`);
    }
  }
  if (intent.schema_version !== "strategy_run_intent.v1") {
    errors.push("schema_version must be strategy_run_intent.v1");
  }
  if (Number.isNaN(Date.parse(intent.created_at))) {
    errors.push("created_at must be a valid timestamp");
  }
  if (intent.paper_only !== true) {
    errors.push("paper_only must be true");
  }
  if (intent.live_execution_allowed !== false) {
    errors.push("live_execution_allowed must be false");
  }
  if (intent.order_placement_allowed !== false) {
    errors.push("order_placement_allowed must be false");
  }
  if (!allowedReplayModes.has(intent.replay_mode)) {
    errors.push("replay_mode is invalid");
  }
  if (!allowedRunModes.has(intent.run_mode)) {
    errors.push("run_mode is invalid");
  }
  if (!allowedRunIntentStatuses.has(intent.status)) {
    errors.push("status is invalid");
  }
  if (intent.strategy_run_intent_id !== strategyRunIntentId({
    strategyDefinitionId: intent.strategy_definition_id,
    replayEvidenceBundleId: intent.source_replay_evidence_bundle_id,
    replayRunManifestId: intent.source_replay_run_manifest_id,
    runMode: intent.run_mode
  })) {
    errors.push("strategy_run_intent_id must be deterministic from strategy definition, replay sources, and run mode");
  }
  if (typeof intent.strategy_definition_id !== "string" || !intent.strategy_definition_id.startsWith("sdef_")) {
    errors.push("strategy_definition_id must reference a StrategyDefinition id");
  }
  if (typeof intent.source_replay_evidence_bundle_id !== "string" || !intent.source_replay_evidence_bundle_id.startsWith("reb_")) {
    errors.push("source_replay_evidence_bundle_id must reference a ReplayEvidenceBundle id");
  }
  if (typeof intent.source_replay_run_manifest_id !== "string" || !intent.source_replay_run_manifest_id.startsWith("rrm_")) {
    errors.push("source_replay_run_manifest_id must reference a ReplayRunManifest id");
  }

  return { ok: errors.length === 0, errors };
}

export function formatStrategyRunIntentValidationReport(report) {
  const lines = [
    "Overlord StrategyRunIntent Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) {
    lines.push(`ERROR ${error}`);
  }
  return lines.join("\n");
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
  const report = await validateStrategyRunIntentFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatStrategyRunIntentValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
