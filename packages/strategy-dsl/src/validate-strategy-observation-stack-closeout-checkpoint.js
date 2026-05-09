import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolveLocalArtifactPath } from "../../replay-engine/src/replay-artifact-reader.js";
import { validateForbiddenFields } from "./strategy-contract-rules.js";
import {
  defaultStrategyObservationStackCloseoutPaths,
  requiredStrategyObservationCloseoutCheckNames,
  strategyObservationStackCloseoutArtifactContracts
} from "./build-strategy-observation-stack-closeout-checkpoint.js";
import { strategyObservationStackCloseoutCheckpointId } from "./strategy-observation-stack-closeout-checkpoint-id.js";
import { readJsonl } from "./strategy-observation-artifacts.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_stack_closeout_checkpoint.json");
const defaultSourceFixturePaths = {
  strategyObservationContract: path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_contract.json"),
  strategyObservationInputSet: path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_input_set.json"),
  strategyObservationNoopSummary: path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_noop_summary.json"),
  strategyObservationEvidenceBundle: path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_evidence_bundle.json"),
  strategyObservationCaseFileSummary: path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_case_file_summary.json")
};
const requiredFields = [
  "strategy_observation_stack_closeout_checkpoint_id",
  "schema_version",
  "generated_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "source_strategy_observation_contract_id",
  "source_strategy_observation_input_set_id",
  "source_strategy_observation_noop_summary_id",
  "source_strategy_observation_evidence_bundle_id",
  "source_strategy_observation_case_file_summary_id",
  "source_strategy_dry_run_stack_closeout_checkpoint_id",
  "source_strategy_definition_id",
  "source_strategy_run_intent_id",
  "replay_mode",
  "run_mode",
  "closeout_artifacts",
  "closeout_checks",
  "consistency_status",
  "freeze_recommendation",
  "status",
  "reason"
];
const requiredArtifactFields = ["artifact_type", "artifact_path", "schema_version", "record_count", "validation_command", "artifact_id"];
const allowedRunModes = new Set(["validation_only", "dry_run_planned"]);
const allowedConsistencyStatuses = new Set(["consistency_passed", "consistency_failed", "consistency_not_applicable"]);
const allowedFreezeRecommendations = new Set(["freeze_ready", "freeze_not_ready", "freeze_not_applicable"]);
const allowedStatuses = new Set(["observation_stack_closeout_ready", "observation_stack_closeout_rejected"]);
const allowedCheckStatuses = new Set(["check_passed", "check_failed", "check_not_applicable"]);
const requiredCheckNames = new Set(requiredStrategyObservationCloseoutCheckNames);
const contractByType = new Map(strategyObservationStackCloseoutArtifactContracts.map((contract) => [contract.artifact_type, contract]));
const expectedPaths = Object.fromEntries(strategyObservationStackCloseoutArtifactContracts.map((contract) => [contract.artifact_type, defaultStrategyObservationStackCloseoutPaths[contract.pathKey]]));
const forbiddenCommandPattern = /\b(curl|wget|fetch|powershell|pwsh|invoke-webrequest|invoke-restmethod|iwr|irm)\b|https?:\/\/|[|<>]/i;

export async function validateStrategyObservationStackCloseoutCheckpointFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let checkpoint;
  try {
    checkpoint = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, (await validateStrategyObservationStackCloseoutCheckpoint(checkpoint, options)).errors);
}

export async function validateStrategyObservationStackCloseoutCheckpoint(checkpoint, options = {}) {
  const errors = [];
  const root = options.repoRoot ?? repoRoot;

  if (!checkpoint || typeof checkpoint !== "object" || Array.isArray(checkpoint)) {
    return { ok: false, errors: ["StrategyObservationStackCloseoutCheckpoint must be a JSON object"] };
  }
  validateForbiddenFields(errors, checkpoint);
  for (const field of requiredFields) {
    if (!Object.hasOwn(checkpoint, field)) errors.push(`${field} is required`);
  }
  validateCoreFields(errors, checkpoint);
  validateIdShapes(errors, checkpoint);
  validateDeterministicId(errors, checkpoint);
  validateLocalSourceFixtureConsistency(errors, checkpoint);
  validateSourceArtifactAlignment(errors, checkpoint);
  await validateCloseoutArtifacts(errors, root, checkpoint.closeout_artifacts);
  validateCloseoutChecks(errors, checkpoint.closeout_checks, checkpoint.status, checkpoint.freeze_recommendation);

  return { ok: errors.length === 0, errors };
}

export function formatStrategyObservationStackCloseoutCheckpointValidationReport(report) {
  const lines = [
    "Overlord StrategyObservationStackCloseoutCheckpoint Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) lines.push(`ERROR ${error}`);
  return lines.join("\n");
}

function validateCoreFields(errors, checkpoint) {
  if (checkpoint.schema_version !== "strategy_observation_stack_closeout_checkpoint.v1") errors.push("schema_version must be strategy_observation_stack_closeout_checkpoint.v1");
  if (Number.isNaN(Date.parse(checkpoint.generated_at))) errors.push("generated_at must be a valid timestamp");
  if (checkpoint.paper_only !== true) errors.push("paper_only must be true");
  if (checkpoint.live_execution_allowed !== false) errors.push("live_execution_allowed must be false");
  if (checkpoint.order_placement_allowed !== false) errors.push("order_placement_allowed must be false");
  if (checkpoint.replay_mode !== "offline_fixture_replay") errors.push("replay_mode is invalid");
  if (!allowedRunModes.has(checkpoint.run_mode)) errors.push("run_mode is invalid");
  if (!allowedConsistencyStatuses.has(checkpoint.consistency_status)) errors.push("consistency_status is invalid");
  if (!allowedFreezeRecommendations.has(checkpoint.freeze_recommendation)) errors.push("freeze_recommendation is invalid");
  if (!allowedStatuses.has(checkpoint.status)) errors.push("status is invalid");
  if (checkpoint.status === "observation_stack_closeout_ready") {
    if (checkpoint.consistency_status !== "consistency_passed") errors.push("ready observation closeout checkpoints require consistency_passed");
    if (checkpoint.freeze_recommendation !== "freeze_ready") errors.push("ready observation closeout checkpoints require freeze_ready");
  }
  if (checkpoint.consistency_status === "consistency_failed" && checkpoint.status !== "observation_stack_closeout_rejected") {
    errors.push("consistency_failed requires observation_stack_closeout_rejected status");
  }
}

function validateIdShapes(errors, checkpoint) {
  if (typeof checkpoint.strategy_observation_stack_closeout_checkpoint_id !== "string" || !checkpoint.strategy_observation_stack_closeout_checkpoint_id.startsWith("soscc_")) errors.push("strategy_observation_stack_closeout_checkpoint_id must reference a StrategyObservationStackCloseoutCheckpoint id");
  if (typeof checkpoint.source_strategy_observation_contract_id !== "string" || !checkpoint.source_strategy_observation_contract_id.startsWith("soc_")) errors.push("source_strategy_observation_contract_id must reference a StrategyObservationContract id");
  if (typeof checkpoint.source_strategy_observation_input_set_id !== "string" || !checkpoint.source_strategy_observation_input_set_id.startsWith("sois_")) errors.push("source_strategy_observation_input_set_id must reference a StrategyObservationInputSet id");
  if (typeof checkpoint.source_strategy_observation_noop_summary_id !== "string" || !checkpoint.source_strategy_observation_noop_summary_id.startsWith("sons_")) errors.push("source_strategy_observation_noop_summary_id must reference a StrategyObservationNoOpSummary id");
  if (typeof checkpoint.source_strategy_observation_evidence_bundle_id !== "string" || !checkpoint.source_strategy_observation_evidence_bundle_id.startsWith("soeb_")) errors.push("source_strategy_observation_evidence_bundle_id must reference a StrategyObservationEvidenceBundle id");
  if (typeof checkpoint.source_strategy_observation_case_file_summary_id !== "string" || !checkpoint.source_strategy_observation_case_file_summary_id.startsWith("socfs_")) errors.push("source_strategy_observation_case_file_summary_id must reference a StrategyObservationCaseFileSummary id");
  if (typeof checkpoint.source_strategy_dry_run_stack_closeout_checkpoint_id !== "string" || !checkpoint.source_strategy_dry_run_stack_closeout_checkpoint_id.startsWith("sdrscc_")) errors.push("source_strategy_dry_run_stack_closeout_checkpoint_id must reference a StrategyDryRunStackCloseoutCheckpoint id");
  if (typeof checkpoint.source_strategy_definition_id !== "string" || !checkpoint.source_strategy_definition_id.startsWith("sdef_")) errors.push("source_strategy_definition_id must reference a StrategyDefinition id");
  if (typeof checkpoint.source_strategy_run_intent_id !== "string" || !checkpoint.source_strategy_run_intent_id.startsWith("sri_")) errors.push("source_strategy_run_intent_id must reference a StrategyRunIntent id");
}

function validateDeterministicId(errors, checkpoint) {
  const expected = strategyObservationStackCloseoutCheckpointId({
    strategyObservationContractId: checkpoint.source_strategy_observation_contract_id,
    strategyObservationInputSetId: checkpoint.source_strategy_observation_input_set_id,
    strategyObservationNoopSummaryId: checkpoint.source_strategy_observation_noop_summary_id,
    strategyObservationEvidenceBundleId: checkpoint.source_strategy_observation_evidence_bundle_id,
    strategyObservationCaseFileSummaryId: checkpoint.source_strategy_observation_case_file_summary_id,
    strategyDryRunStackCloseoutCheckpointId: checkpoint.source_strategy_dry_run_stack_closeout_checkpoint_id,
    strategyDefinitionId: checkpoint.source_strategy_definition_id,
    strategyRunIntentId: checkpoint.source_strategy_run_intent_id,
    freezeRecommendation: checkpoint.freeze_recommendation
  });
  if (checkpoint.strategy_observation_stack_closeout_checkpoint_id !== expected) {
    errors.push("strategy_observation_stack_closeout_checkpoint_id must be deterministic from closeout source ids and freeze recommendation");
  }
}

function validateSourceArtifactAlignment(errors, checkpoint) {
  if (!Array.isArray(checkpoint.closeout_artifacts)) return;
  const artifactByType = new Map(checkpoint.closeout_artifacts.map((artifact) => [artifact.artifact_type, artifact]));
  const expected = {
    strategy_observation_contract: checkpoint.source_strategy_observation_contract_id,
    strategy_observation_input_set: checkpoint.source_strategy_observation_input_set_id,
    strategy_observation_noop_summary: checkpoint.source_strategy_observation_noop_summary_id,
    strategy_observation_evidence_bundle: checkpoint.source_strategy_observation_evidence_bundle_id,
    strategy_observation_case_file_summary: checkpoint.source_strategy_observation_case_file_summary_id
  };
  for (const [artifactType, expectedId] of Object.entries(expected)) {
    const artifact = artifactByType.get(artifactType);
    if (artifact && artifact.artifact_id !== expectedId) errors.push(`${artifactType} artifact_id must match source id`);
  }
  const traceArtifact = artifactByType.get("strategy_observation_trace");
  if (traceArtifact && traceArtifact.artifact_id !== null) errors.push("strategy_observation_trace artifact_id must be null");
}

function validateLocalSourceFixtureConsistency(errors, checkpoint) {
  try {
    const observationContract = readLocalJson(defaultSourceFixturePaths.strategyObservationContract);
    const observationInputSet = readLocalJson(defaultSourceFixturePaths.strategyObservationInputSet);
    const observationNoopSummary = readLocalJson(defaultSourceFixturePaths.strategyObservationNoopSummary);
    const observationEvidenceBundle = readLocalJson(defaultSourceFixturePaths.strategyObservationEvidenceBundle);
    const observationCaseFileSummary = readLocalJson(defaultSourceFixturePaths.strategyObservationCaseFileSummary);
    if (checkpoint.source_strategy_observation_contract_id !== observationContract.strategy_observation_contract_id) errors.push("source_strategy_observation_contract_id must match the local observation contract fixture");
    if (checkpoint.source_strategy_observation_input_set_id !== observationInputSet.strategy_observation_input_set_id) errors.push("source_strategy_observation_input_set_id must match the local observation input set fixture");
    if (checkpoint.source_strategy_observation_noop_summary_id !== observationNoopSummary.strategy_observation_noop_summary_id) errors.push("source_strategy_observation_noop_summary_id must match the local observation no-op summary fixture");
    if (checkpoint.source_strategy_observation_evidence_bundle_id !== observationEvidenceBundle.strategy_observation_evidence_bundle_id) errors.push("source_strategy_observation_evidence_bundle_id must match the local observation evidence bundle fixture");
    if (checkpoint.source_strategy_observation_case_file_summary_id !== observationCaseFileSummary.strategy_observation_case_file_summary_id) errors.push("source_strategy_observation_case_file_summary_id must match the local observation case-file summary fixture");
    if (checkpoint.source_strategy_dry_run_stack_closeout_checkpoint_id !== observationContract.strategy_dry_run_stack_closeout_checkpoint_id) errors.push("source_strategy_dry_run_stack_closeout_checkpoint_id must match the local observation contract fixture");
    if (checkpoint.source_strategy_definition_id !== observationContract.strategy_definition_id) errors.push("source_strategy_definition_id must match the local observation contract fixture");
    if (checkpoint.source_strategy_run_intent_id !== observationContract.strategy_run_intent_id) errors.push("source_strategy_run_intent_id must match the local observation contract fixture");
  } catch (error) {
    errors.push(`local observation closeout source consistency could not be verified: ${error.message}`);
  }
}

async function validateCloseoutArtifacts(errors, root, artifacts) {
  if (!Array.isArray(artifacts) || artifacts.length === 0) {
    errors.push("closeout_artifacts must be a non-empty array");
    return;
  }
  const seenTypes = new Set();
  for (const artifact of artifacts) {
    if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
      errors.push("closeout_artifact must be an object");
      continue;
    }
    for (const field of requiredArtifactFields) {
      if (!Object.hasOwn(artifact, field)) errors.push(`closeout_artifact ${field} is required`);
    }
    const contract = contractByType.get(artifact.artifact_type);
    if (!contract) {
      errors.push("closeout artifact_type is invalid");
    } else {
      if (artifact.artifact_path !== expectedPaths[artifact.artifact_type]) errors.push("closeout artifact_path must match the known observation closeout contract");
      if (artifact.schema_version !== contract.schema_version) errors.push("closeout artifact schema_version must match the known observation closeout contract");
      if (artifact.validation_command !== contract.validation_command) errors.push("closeout artifact validation_command must match the known observation closeout contract");
    }
    if (seenTypes.has(artifact.artifact_type)) errors.push("duplicate closeout artifact_type is not allowed");
    seenTypes.add(artifact.artifact_type);
    if (!Number.isInteger(artifact.record_count) || artifact.record_count < 0) errors.push("closeout artifact record_count must be a non-negative integer");
    if (!isSafeLocalNpmCommand(artifact.validation_command)) errors.push("closeout artifact validation_command must be a local npm script");
    await validateSafePath(errors, root, artifact.artifact_path, "closeout artifact_path");
    if (typeof artifact.artifact_path === "string" && Number.isInteger(artifact.record_count)) {
      try {
        const actual = await countArtifactRecords(root, artifact.artifact_path);
        if (actual !== artifact.record_count) errors.push("closeout artifact record_count must match local fixture count");
      } catch (error) {
        errors.push(`closeout artifact record_count could not be verified: ${error.message}`);
      }
    }
  }
  for (const contract of strategyObservationStackCloseoutArtifactContracts) {
    if (!seenTypes.has(contract.artifact_type)) errors.push(`missing required closeout artifact_type: ${contract.artifact_type}`);
  }
}

function validateCloseoutChecks(errors, checks, status, freezeRecommendation) {
  if (!Array.isArray(checks) || checks.length === 0) {
    errors.push("closeout_checks must be a non-empty array");
    return;
  }
  const seen = new Set();
  for (const check of checks) {
    if (!check || typeof check !== "object" || Array.isArray(check)) {
      errors.push("closeout_check must be an object");
      continue;
    }
    for (const field of ["check_name", "status", "reason"]) {
      if (!Object.hasOwn(check, field)) errors.push(`closeout_check ${field} is required`);
    }
    if (seen.has(check.check_name)) errors.push("duplicate closeout_check name is not allowed");
    seen.add(check.check_name);
    if (!requiredCheckNames.has(check.check_name)) errors.push("closeout_check name is invalid");
    if (!allowedCheckStatuses.has(check.status)) errors.push("closeout_check status is invalid");
  }
  for (const checkName of requiredCheckNames) {
    if (!seen.has(checkName)) errors.push(`missing required closeout_check: ${checkName}`);
  }
  const hasFailedRequiredCheck = checks.some((check) => requiredCheckNames.has(check.check_name) && check.status === "check_failed");
  if (status === "observation_stack_closeout_ready" && checks.some((check) => requiredCheckNames.has(check.check_name) && check.status !== "check_passed")) {
    errors.push("ready observation closeout checkpoints require all required closeout checks to pass");
  }
  if (hasFailedRequiredCheck) {
    if (status !== "observation_stack_closeout_rejected") errors.push("failed observation closeout checks require observation_stack_closeout_rejected status");
    if (freezeRecommendation !== "freeze_not_ready") errors.push("failed observation closeout checks require freeze_not_ready");
  }
}

async function countArtifactRecords(root, artifactPath) {
  if (artifactPath.endsWith(".jsonl")) {
    return (await readJsonl(root, artifactPath)).length;
  }
  JSON.parse(await readFile(path.join(root, artifactPath), "utf8"));
  return 1;
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

function readLocalJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function makeReport(filePath, errors) {
  return { ok: errors.length === 0, filePath: path.relative(repoRoot, filePath).replaceAll("\\", "/"), errors };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const explicitPath = process.argv.find((arg) => arg.endsWith(".json"));
  const report = await validateStrategyObservationStackCloseoutCheckpointFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatStrategyObservationStackCloseoutCheckpointValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
