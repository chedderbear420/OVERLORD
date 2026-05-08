import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { resolveLocalArtifactPath } from "../../replay-engine/src/replay-artifact-reader.js";
import { validateForbiddenFields } from "./strategy-contract-rules.js";
import {
  requiredReadinessCheckNames,
  defaultDryRunReadinessPaths
} from "./build-strategy-dry-run-readiness-checkpoint.js";
import { readJson } from "./strategy-run-artifacts.js";
import { strategyDryRunReadinessCheckpointId } from "./strategy-dry-run-readiness-checkpoint-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_dry_run_readiness_checkpoint.json");
const requiredFields = [
  "strategy_dry_run_readiness_checkpoint_id",
  "schema_version",
  "generated_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "strategy_definition_id",
  "strategy_run_intent_id",
  "strategy_run_manifest_id",
  "strategy_run_evidence_bundle_id",
  "strategy_dry_run_plan_id",
  "strategy_dry_run_plan_evidence_summary_id",
  "source_strategy_definition_id",
  "source_strategy_run_intent_id",
  "source_strategy_run_manifest_id",
  "source_strategy_run_evidence_bundle_id",
  "source_strategy_dry_run_plan_id",
  "source_strategy_dry_run_plan_evidence_summary_id",
  "replay_mode",
  "run_mode",
  "prerequisite_artifacts",
  "readiness_checks",
  "readiness_status",
  "status",
  "reason"
];
const expectedArtifactTypes = [
  "strategy_definition",
  "strategy_run_intent",
  "strategy_run_manifest",
  "strategy_run_evidence_bundle",
  "strategy_dry_run_plan",
  "strategy_dry_run_plan_evidence_summary"
];
const allowedReplayModes = new Set(["offline_fixture_replay"]);
const allowedRunModes = new Set(["validation_only", "dry_run_planned"]);
const allowedReadinessStatuses = new Set(["dry_run_ready", "dry_run_not_ready", "dry_run_readiness_unknown"]);
const allowedStatuses = new Set(["dry_run_readiness_checkpoint_ready", "dry_run_readiness_checkpoint_rejected"]);
const allowedCheckStatuses = new Set(["check_passed", "check_failed", "check_not_applicable"]);

export async function validateStrategyDryRunReadinessCheckpointFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let checkpoint;
  try {
    checkpoint = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, (await validateStrategyDryRunReadinessCheckpoint(checkpoint, options)).errors);
}

export async function validateStrategyDryRunReadinessCheckpoint(checkpoint, options = {}) {
  const errors = [];
  const root = options.repoRoot ?? repoRoot;

  if (!checkpoint || typeof checkpoint !== "object" || Array.isArray(checkpoint)) {
    return { ok: false, errors: ["StrategyDryRunReadinessCheckpoint must be a JSON object"] };
  }
  validateForbiddenFields(errors, checkpoint);
  for (const field of requiredFields) {
    if (!Object.hasOwn(checkpoint, field)) errors.push(`${field} is required`);
  }
  validateCoreFields(errors, checkpoint);
  validateIdShapes(errors, checkpoint);
  validateDeterministicId(errors, checkpoint);
  await validatePrerequisiteArtifacts(errors, root, checkpoint.prerequisite_artifacts);
  validateReadinessChecks(errors, checkpoint);
  await validateAgainstSources(errors, root, checkpoint, options);

  return { ok: errors.length === 0, errors };
}

export function formatStrategyDryRunReadinessCheckpointValidationReport(report) {
  const lines = [
    "Overlord StrategyDryRunReadinessCheckpoint Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) lines.push(`ERROR ${error}`);
  return lines.join("\n");
}

function validateCoreFields(errors, checkpoint) {
  if (checkpoint.schema_version !== "strategy_dry_run_readiness_checkpoint.v1") errors.push("schema_version must be strategy_dry_run_readiness_checkpoint.v1");
  if (Number.isNaN(Date.parse(checkpoint.generated_at))) errors.push("generated_at must be a valid timestamp");
  if (checkpoint.paper_only !== true) errors.push("paper_only must be true");
  if (checkpoint.live_execution_allowed !== false) errors.push("live_execution_allowed must be false");
  if (checkpoint.order_placement_allowed !== false) errors.push("order_placement_allowed must be false");
  if (!allowedReplayModes.has(checkpoint.replay_mode)) errors.push("replay_mode is invalid");
  if (!allowedRunModes.has(checkpoint.run_mode)) errors.push("run_mode is invalid");
  if (!allowedReadinessStatuses.has(checkpoint.readiness_status)) errors.push("readiness_status is invalid");
  if (!allowedStatuses.has(checkpoint.status)) errors.push("status is invalid");
  if (checkpoint.readiness_status === "dry_run_ready" && checkpoint.status !== "dry_run_readiness_checkpoint_ready") {
    errors.push("dry_run_ready requires dry_run_readiness_checkpoint_ready status");
  }
}

function validateIdShapes(errors, checkpoint) {
  if (typeof checkpoint.strategy_definition_id !== "string" || !checkpoint.strategy_definition_id.startsWith("sdef_")) errors.push("strategy_definition_id must reference a StrategyDefinition id");
  if (typeof checkpoint.strategy_run_intent_id !== "string" || !checkpoint.strategy_run_intent_id.startsWith("sri_")) errors.push("strategy_run_intent_id must reference a StrategyRunIntent id");
  if (typeof checkpoint.strategy_run_manifest_id !== "string" || !checkpoint.strategy_run_manifest_id.startsWith("srm_")) errors.push("strategy_run_manifest_id must reference a StrategyRunManifest id");
  if (typeof checkpoint.strategy_run_evidence_bundle_id !== "string" || !checkpoint.strategy_run_evidence_bundle_id.startsWith("sreb_")) errors.push("strategy_run_evidence_bundle_id must reference a StrategyRunEvidenceBundle id");
  if (typeof checkpoint.strategy_dry_run_plan_id !== "string" || !checkpoint.strategy_dry_run_plan_id.startsWith("sdrp_")) errors.push("strategy_dry_run_plan_id must reference a StrategyDryRunPlan id");
  if (typeof checkpoint.strategy_dry_run_plan_evidence_summary_id !== "string" || !checkpoint.strategy_dry_run_plan_evidence_summary_id.startsWith("sdrpes_")) errors.push("strategy_dry_run_plan_evidence_summary_id must reference a StrategyDryRunPlanEvidenceSummary id");
  if (checkpoint.source_strategy_definition_id !== checkpoint.strategy_definition_id) errors.push("source_strategy_definition_id must match strategy_definition_id");
  if (checkpoint.source_strategy_run_intent_id !== checkpoint.strategy_run_intent_id) errors.push("source_strategy_run_intent_id must match strategy_run_intent_id");
  if (checkpoint.source_strategy_run_manifest_id !== checkpoint.strategy_run_manifest_id) errors.push("source_strategy_run_manifest_id must match strategy_run_manifest_id");
  if (checkpoint.source_strategy_run_evidence_bundle_id !== checkpoint.strategy_run_evidence_bundle_id) errors.push("source_strategy_run_evidence_bundle_id must match strategy_run_evidence_bundle_id");
  if (checkpoint.source_strategy_dry_run_plan_id !== checkpoint.strategy_dry_run_plan_id) errors.push("source_strategy_dry_run_plan_id must match strategy_dry_run_plan_id");
  if (checkpoint.source_strategy_dry_run_plan_evidence_summary_id !== checkpoint.strategy_dry_run_plan_evidence_summary_id) errors.push("source_strategy_dry_run_plan_evidence_summary_id must match strategy_dry_run_plan_evidence_summary_id");
}

function validateDeterministicId(errors, checkpoint) {
  const expected = strategyDryRunReadinessCheckpointId({
    strategyDefinitionId: checkpoint.strategy_definition_id,
    strategyRunIntentId: checkpoint.strategy_run_intent_id,
    strategyRunManifestId: checkpoint.strategy_run_manifest_id,
    strategyRunEvidenceBundleId: checkpoint.strategy_run_evidence_bundle_id,
    strategyDryRunPlanId: checkpoint.strategy_dry_run_plan_id,
    strategyDryRunPlanEvidenceSummaryId: checkpoint.strategy_dry_run_plan_evidence_summary_id,
    readinessStatus: checkpoint.readiness_status,
    generatedAt: checkpoint.generated_at
  });
  if (checkpoint.strategy_dry_run_readiness_checkpoint_id !== expected) {
    errors.push("strategy_dry_run_readiness_checkpoint_id must be deterministic from source ids, readiness status, and generated_at");
  }
}

async function validatePrerequisiteArtifacts(errors, root, artifacts) {
  if (!Array.isArray(artifacts) || artifacts.length === 0) {
    errors.push("prerequisite_artifacts must be a non-empty array");
    return;
  }
  const byType = new Map();
  for (const artifact of artifacts) {
    if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
      errors.push("prerequisite_artifact must be an object");
      continue;
    }
    for (const field of ["artifact_type", "artifact_path", "schema_version", "validation_command", "artifact_id", "validation_status"]) {
      if (!Object.hasOwn(artifact, field)) errors.push(`prerequisite_artifact ${field} is required`);
    }
    if (!expectedArtifactTypes.includes(artifact.artifact_type)) errors.push("prerequisite_artifact artifact_type is invalid");
    if (byType.has(artifact.artifact_type)) errors.push("duplicate prerequisite_artifact artifact_type is not allowed");
    byType.set(artifact.artifact_type, artifact);
    if (artifact.validation_status !== "validation_passed") errors.push("prerequisite_artifact validation_status must be validation_passed");
    if (typeof artifact.validation_command !== "string" || !artifact.validation_command.startsWith("npm run validate:")) {
      errors.push("prerequisite_artifact validation_command must be a local npm validation script");
    }
    await validateSafePath(errors, root, artifact.artifact_path, "prerequisite_artifact artifact_path");
  }
  for (const artifactType of expectedArtifactTypes) {
    if (!byType.has(artifactType)) errors.push(`prerequisite_artifacts must include ${artifactType}`);
  }
}

function validateReadinessChecks(errors, checkpoint) {
  const checks = checkpoint.readiness_checks;
  if (!Array.isArray(checks) || checks.length === 0) {
    errors.push("readiness_checks must be a non-empty array");
    return;
  }
  const byName = new Map();
  for (const check of checks) {
    if (!check || typeof check !== "object" || Array.isArray(check)) {
      errors.push("readiness_check must be an object");
      continue;
    }
    for (const field of ["check_name", "status", "reason"]) {
      if (!Object.hasOwn(check, field)) errors.push(`readiness_check ${field} is required`);
    }
    if (byName.has(check.check_name)) errors.push("duplicate readiness_check check_name is not allowed");
    byName.set(check.check_name, check);
    if (!allowedCheckStatuses.has(check.status)) errors.push("readiness_check status is invalid");
  }
  for (const checkName of requiredReadinessCheckNames) {
    if (!byName.has(checkName)) errors.push(`readiness_checks must include ${checkName}`);
  }
  const requiredChecks = requiredReadinessCheckNames.map((checkName) => byName.get(checkName)).filter(Boolean);
  if (checkpoint.readiness_status === "dry_run_ready" && requiredChecks.some((check) => check.status !== "check_passed")) {
    errors.push("dry_run_ready requires all required readiness checks to pass");
  }
  if (requiredChecks.some((check) => check.status === "check_failed") && checkpoint.readiness_status !== "dry_run_not_ready") {
    errors.push("failed readiness checks require dry_run_not_ready");
  }
}

async function validateAgainstSources(errors, root, checkpoint, options) {
  if (options.skipSourceChecks === true) return;
  let sources;
  try {
    sources = options.sources ?? {
      definition: await readJson(root, defaultDryRunReadinessPaths.definitionPath),
      intent: await readJson(root, defaultDryRunReadinessPaths.intentPath),
      manifest: await readJson(root, defaultDryRunReadinessPaths.manifestPath),
      evidenceBundle: await readJson(root, defaultDryRunReadinessPaths.evidenceBundlePath),
      dryRunPlan: await readJson(root, defaultDryRunReadinessPaths.dryRunPlanPath),
      dryRunPlanEvidenceSummary: await readJson(root, defaultDryRunReadinessPaths.dryRunPlanEvidenceSummaryPath)
    };
  } catch (error) {
    errors.push(`source strategy dry-run readiness artifacts could not be read: ${error.message}`);
    return;
  }
  if (checkpoint.strategy_definition_id !== sources.definition.strategy_definition_id) errors.push("strategy_definition_id must match source StrategyDefinition");
  if (checkpoint.strategy_run_intent_id !== sources.intent.strategy_run_intent_id) errors.push("strategy_run_intent_id must match source StrategyRunIntent");
  if (checkpoint.strategy_run_manifest_id !== sources.manifest.strategy_run_manifest_id) errors.push("strategy_run_manifest_id must match source StrategyRunManifest");
  if (checkpoint.strategy_run_evidence_bundle_id !== sources.evidenceBundle.strategy_run_evidence_bundle_id) errors.push("strategy_run_evidence_bundle_id must match source StrategyRunEvidenceBundle");
  if (checkpoint.strategy_dry_run_plan_id !== sources.dryRunPlan.strategy_dry_run_plan_id) errors.push("strategy_dry_run_plan_id must match source StrategyDryRunPlan");
  if (checkpoint.strategy_dry_run_plan_evidence_summary_id !== sources.dryRunPlanEvidenceSummary.strategy_dry_run_plan_evidence_summary_id) errors.push("strategy_dry_run_plan_evidence_summary_id must match source StrategyDryRunPlanEvidenceSummary");
}

async function validateSafePath(errors, root, artifactPath, label) {
  try {
    await resolveLocalArtifactPath(root, artifactPath);
  } catch (error) {
    errors.push(`${label} ${error.message}`);
  }
}

function makeReport(filePath, errors) {
  return { ok: errors.length === 0, filePath: path.relative(repoRoot, filePath).replaceAll("\\", "/"), errors };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const explicitPath = process.argv.find((arg) => arg.endsWith(".json"));
  const report = await validateStrategyDryRunReadinessCheckpointFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatStrategyDryRunReadinessCheckpointValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
