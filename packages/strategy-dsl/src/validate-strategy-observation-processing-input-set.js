import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { resolveLocalArtifactPath } from "../../replay-engine/src/replay-artifact-reader.js";
import { validateForbiddenFields } from "./strategy-contract-rules.js";
import {
  makeBoundaryError,
  observationValidationReasonCodes,
  validateNoUnknownFields,
  validateObservationBoundary,
  validateSafeStrategyDslArtifactPath
} from "./strategy-observation-boundary-guard.js";
import { allowedProcessingInputs } from "./build-strategy-observation-processing-contract.js";
import { strategyObservationProcessingInputSetId } from "./strategy-observation-processing-input-set-id.js";
import { readJsonl } from "./strategy-dry-run-artifacts.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_processing_input_set.json");
const sourceFixtures = {
  contract: readLocalJson("synthetic_strategy_observation_processing_contract.json"),
  caseFile: readLocalJson("synthetic_strategy_observation_case_file_summary.json"),
  evidenceBundle: readLocalJson("synthetic_strategy_observation_evidence_bundle.json"),
  noopSummary: readLocalJson("synthetic_strategy_observation_noop_summary.json"),
  closeout: readLocalJson("synthetic_strategy_observation_stack_closeout_checkpoint.json")
};
const requiredFields = [
  "strategy_observation_processing_input_set_id",
  "schema_version",
  "generated_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "strategy_observation_processing_contract_id",
  "strategy_observation_stack_closeout_checkpoint_id",
  "source_strategy_observation_stack_closeout_checkpoint_id",
  "source_strategy_observation_case_file_summary_id",
  "source_strategy_observation_evidence_bundle_id",
  "source_strategy_observation_noop_summary_id",
  "source_strategy_definition_id",
  "source_strategy_run_intent_id",
  "replay_mode",
  "run_mode",
  "input_artifacts",
  "status",
  "reason_code",
  "reason"
];
const requiredArtifactFields = ["artifact_type", "artifact_path", "artifact_id", "record_count", "access_mode"];
const expectedArtifactPaths = new Map([
  ["strategy_observation_contract", "packages/strategy-dsl/fixtures/synthetic_strategy_observation_contract.json"],
  ["strategy_observation_input_set", "packages/strategy-dsl/fixtures/synthetic_strategy_observation_input_set.json"],
  ["strategy_observation_trace", "packages/strategy-dsl/fixtures/synthetic_strategy_observation_trace.jsonl"],
  ["strategy_observation_noop_summary", "packages/strategy-dsl/fixtures/synthetic_strategy_observation_noop_summary.json"],
  ["strategy_observation_evidence_bundle", "packages/strategy-dsl/fixtures/synthetic_strategy_observation_evidence_bundle.json"],
  ["strategy_observation_case_file_summary", "packages/strategy-dsl/fixtures/synthetic_strategy_observation_case_file_summary.json"],
  ["strategy_observation_stack_closeout_checkpoint", "packages/strategy-dsl/fixtures/synthetic_strategy_observation_stack_closeout_checkpoint.json"]
]);
const allowedStatuses = new Set(["strategy_observation_processing_input_set_ready", "strategy_observation_processing_input_set_rejected"]);
const allowedRunModes = new Set(["validation_only", "dry_run_planned"]);
const allowedInputSet = new Set(allowedProcessingInputs);

export async function validateStrategyObservationProcessingInputSetFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let inputSet;
  try {
    inputSet = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, (await validateStrategyObservationProcessingInputSet(inputSet, options)).errors);
}

export async function validateStrategyObservationProcessingInputSet(inputSet, options = {}) {
  const errors = [];
  const root = options.repoRoot ?? repoRoot;

  if (!inputSet || typeof inputSet !== "object" || Array.isArray(inputSet)) {
    return { ok: false, errors: ["StrategyObservationProcessingInputSet must be a JSON object"] };
  }
  validateNoUnknownFields(errors, inputSet, requiredFields, "StrategyObservationProcessingInputSet");
  appendBoundaryErrors(errors, validateObservationBoundary(inputSet));
  validateForbiddenFields(errors, inputSet);
  for (const field of requiredFields) {
    if (!Object.hasOwn(inputSet, field)) errors.push(`${field} is required`);
  }
  validateCoreFields(errors, inputSet);
  validateIdShapes(errors, inputSet);
  validateSourceFixtureConsistency(errors, inputSet);
  validateDeterministicId(errors, inputSet);
  validateReasonCode(errors, inputSet);
  await validateInputArtifacts(errors, root, inputSet.input_artifacts);

  return { ok: errors.length === 0, errors };
}

export function formatStrategyObservationProcessingInputSetValidationReport(report) {
  const lines = [
    "Overlord StrategyObservationProcessingInputSet Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) lines.push(`ERROR ${error}`);
  return lines.join("\n");
}

function validateCoreFields(errors, inputSet) {
  if (inputSet.schema_version !== "strategy_observation_processing_input_set.v1") errors.push("schema_version must be strategy_observation_processing_input_set.v1");
  if (Number.isNaN(Date.parse(inputSet.generated_at))) errors.push("generated_at must be a valid timestamp");
  if (inputSet.paper_only !== true) errors.push("paper_only must be true");
  if (inputSet.live_execution_allowed !== false) errors.push("live_execution_allowed must be false");
  if (inputSet.order_placement_allowed !== false) errors.push("order_placement_allowed must be false");
  if (inputSet.replay_mode !== "offline_fixture_replay") errors.push("replay_mode is invalid");
  if (!allowedRunModes.has(inputSet.run_mode)) errors.push("run_mode is invalid");
  if (!allowedStatuses.has(inputSet.status)) errors.push("status is invalid");
}

function validateReasonCode(errors, inputSet) {
  if (inputSet.reason_code !== observationValidationReasonCodes.VALIDATION_PASSED) errors.push("reason_code must be VALIDATION_PASSED");
  if (typeof inputSet.reason !== "string" || inputSet.reason.length === 0) errors.push("reason must be a non-empty string");
}

function validateIdShapes(errors, inputSet) {
  if (typeof inputSet.strategy_observation_processing_input_set_id !== "string" || !inputSet.strategy_observation_processing_input_set_id.startsWith("sopis_")) errors.push("strategy_observation_processing_input_set_id must reference a StrategyObservationProcessingInputSet id");
  if (typeof inputSet.strategy_observation_processing_contract_id !== "string" || !inputSet.strategy_observation_processing_contract_id.startsWith("sopc_")) errors.push("strategy_observation_processing_contract_id must reference a StrategyObservationProcessingContract id");
  if (typeof inputSet.strategy_observation_stack_closeout_checkpoint_id !== "string" || !inputSet.strategy_observation_stack_closeout_checkpoint_id.startsWith("soscc_")) errors.push("strategy_observation_stack_closeout_checkpoint_id must reference a StrategyObservationStackCloseoutCheckpoint id");
  if (inputSet.source_strategy_observation_stack_closeout_checkpoint_id !== inputSet.strategy_observation_stack_closeout_checkpoint_id) errors.push("source_strategy_observation_stack_closeout_checkpoint_id must match strategy_observation_stack_closeout_checkpoint_id");
  if (typeof inputSet.source_strategy_observation_case_file_summary_id !== "string" || !inputSet.source_strategy_observation_case_file_summary_id.startsWith("socfs_")) errors.push("source_strategy_observation_case_file_summary_id must reference a StrategyObservationCaseFileSummary id");
  if (typeof inputSet.source_strategy_observation_evidence_bundle_id !== "string" || !inputSet.source_strategy_observation_evidence_bundle_id.startsWith("soeb_")) errors.push("source_strategy_observation_evidence_bundle_id must reference a StrategyObservationEvidenceBundle id");
  if (typeof inputSet.source_strategy_observation_noop_summary_id !== "string" || !inputSet.source_strategy_observation_noop_summary_id.startsWith("sons_")) errors.push("source_strategy_observation_noop_summary_id must reference a StrategyObservationNoOpSummary id");
  if (typeof inputSet.source_strategy_definition_id !== "string" || !inputSet.source_strategy_definition_id.startsWith("sdef_")) errors.push("source_strategy_definition_id must reference a StrategyDefinition id");
  if (typeof inputSet.source_strategy_run_intent_id !== "string" || !inputSet.source_strategy_run_intent_id.startsWith("sri_")) errors.push("source_strategy_run_intent_id must reference a StrategyRunIntent id");
}

function validateDeterministicId(errors, inputSet) {
  const expected = strategyObservationProcessingInputSetId({
    strategyObservationProcessingContractId: inputSet.strategy_observation_processing_contract_id,
    strategyObservationStackCloseoutCheckpointId: inputSet.strategy_observation_stack_closeout_checkpoint_id,
    inputArtifactCount: Array.isArray(inputSet.input_artifacts) ? inputSet.input_artifacts.length : undefined
  });
  if (inputSet.strategy_observation_processing_input_set_id !== expected) errors.push("strategy_observation_processing_input_set_id must be deterministic from observation processing contract, closeout checkpoint, and input count");
}

function validateSourceFixtureConsistency(errors, inputSet) {
  if (inputSet.strategy_observation_processing_contract_id !== sourceFixtures.contract.strategy_observation_processing_contract_id) errors.push("strategy_observation_processing_contract_id must match local StrategyObservationProcessingContract fixture");
  if (inputSet.strategy_observation_stack_closeout_checkpoint_id !== sourceFixtures.closeout.strategy_observation_stack_closeout_checkpoint_id) errors.push("strategy_observation_stack_closeout_checkpoint_id must match local StrategyObservationStackCloseoutCheckpoint fixture");
  if (inputSet.source_strategy_observation_case_file_summary_id !== sourceFixtures.caseFile.strategy_observation_case_file_summary_id) errors.push("source_strategy_observation_case_file_summary_id must match local StrategyObservationCaseFileSummary fixture");
  if (inputSet.source_strategy_observation_evidence_bundle_id !== sourceFixtures.evidenceBundle.strategy_observation_evidence_bundle_id) errors.push("source_strategy_observation_evidence_bundle_id must match local StrategyObservationEvidenceBundle fixture");
  if (inputSet.source_strategy_observation_noop_summary_id !== sourceFixtures.noopSummary.strategy_observation_noop_summary_id) errors.push("source_strategy_observation_noop_summary_id must match local StrategyObservationNoOpSummary fixture");
}

async function validateInputArtifacts(errors, root, artifacts) {
  if (!Array.isArray(artifacts) || artifacts.length === 0) {
    errors.push("input_artifacts must be a non-empty array");
    return;
  }
  const seen = new Set();
  for (const artifact of artifacts) {
    if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
      errors.push("input_artifact must be an object");
      continue;
    }
    for (const field of requiredArtifactFields) {
      if (!Object.hasOwn(artifact, field)) errors.push(`input_artifact ${field} is required`);
    }
    if (!allowedInputSet.has(artifact.artifact_type)) errors.push("input_artifact artifact_type is invalid");
    if (seen.has(artifact.artifact_type)) errors.push("duplicate input_artifact artifact_type is not allowed");
    seen.add(artifact.artifact_type);
    if (expectedArtifactPaths.has(artifact.artifact_type) && artifact.artifact_path !== expectedArtifactPaths.get(artifact.artifact_type)) {
      errors.push("input_artifact artifact_path must match expected artifact path for artifact_type");
    }
    if (artifact.access_mode !== "read_only") errors.push("input_artifact access_mode must be read_only");
    if (!Number.isInteger(artifact.record_count) || artifact.record_count < 0) errors.push("input_artifact record_count must be a non-negative integer");
    await validateSafePath(errors, root, artifact.artifact_path, "input_artifact artifact_path");
    if (typeof artifact.artifact_path === "string" && Number.isInteger(artifact.record_count)) {
      try {
        const actual = await countArtifactRecords(root, artifact.artifact_path);
        if (actual !== artifact.record_count) errors.push("input_artifact record_count must match local fixture count");
      } catch (error) {
        errors.push(`input_artifact record_count could not be verified: ${error.message}`);
      }
    }
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
  await validateSafeStrategyDslArtifactPath(errors, root, artifactPath, label);
  try {
    await resolveLocalArtifactPath(root, artifactPath);
  } catch (error) {
    errors.push(`${label} ${error.message}`);
  }
}

function appendBoundaryErrors(errors, report) {
  for (const error of report.errors) {
    errors.push(`${error.reason_code}: ${error.message}`);
  }
}

function makeReport(filePath, errors) {
  return { ok: errors.length === 0, filePath: path.relative(repoRoot, filePath).replaceAll("\\", "/"), errors };
}

function readLocalJson(fileName) {
  return JSON.parse(readFileSync(path.join(repoRoot, "packages", "strategy-dsl", "fixtures", fileName), "utf8"));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const explicitPath = process.argv.find((arg) => arg.endsWith(".json"));
  const report = await validateStrategyObservationProcessingInputSetFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatStrategyObservationProcessingInputSetValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
