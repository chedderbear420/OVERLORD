import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hashInputArtifacts } from "./build-strategy-observation-processing-artifact-manifest.js";
import { strategyObservationProcessingArtifactManifestId } from "./strategy-observation-processing-artifact-manifest-id.js";
import {
  makeBoundaryError,
  observationValidationReasonCodes,
  validateNoUnknownFields,
  validateObservationBoundary,
  validateSafeStrategyDslArtifactPath
} from "./strategy-observation-boundary-guard.js";
import { validateStrategyObservationProcessingInputSet } from "./validate-strategy-observation-processing-input-set.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_processing_artifact_manifest.json");
const requiredFields = [
  "artifact_manifest_id",
  "schema_version",
  "created_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "strategy_observation_processing_contract_id",
  "strategy_observation_processing_input_set_id",
  "input_artifacts",
  "artifact_hashes",
  "processing_output_artifacts",
  "output_artifact_hashes",
  "source_provenance",
  "validation_status",
  "status",
  "reason_code",
  "reason"
];
const artifactFields = ["artifact_type", "artifact_path", "artifact_id", "record_count", "access_mode"];
const outputArtifactFields = ["artifact_type", "artifact_path", "artifact_id", "record_count"];
const hashFields = ["artifact_type", "artifact_path", "sha256"];
const provenanceFields = [
  "source_strategy_observation_stack_closeout_checkpoint_id",
  "source_strategy_observation_case_file_summary_id",
  "source_strategy_observation_evidence_bundle_id",
  "source_strategy_observation_noop_summary_id",
  "source_strategy_definition_id",
  "source_strategy_run_intent_id"
];

export async function validateStrategyObservationProcessingArtifactManifestFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let manifest;
  try {
    manifest = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, (await validateStrategyObservationProcessingArtifactManifest(manifest, options)).errors);
}

export async function validateStrategyObservationProcessingArtifactManifest(manifest, options = {}) {
  const errors = [];
  const root = options.repoRoot ?? repoRoot;

  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return { ok: false, errors: ["StrategyObservationProcessingArtifactManifest must be a JSON object"] };
  }
  validateNoUnknownFields(errors, manifest, requiredFields, "StrategyObservationProcessingArtifactManifest");
  appendBoundaryErrors(errors, validateObservationBoundary(manifest));
  for (const field of requiredFields) {
    if (!Object.hasOwn(manifest, field)) errors.push(`${field} is required`);
  }
  validateCoreFields(errors, manifest);
  validateDeterministicId(errors, manifest);
  await validateManifestArtifacts(errors, root, manifest);
  await validateHashes(errors, root, manifest);
  validateOutputArtifacts(errors, manifest);
  await validateOutputHashes(errors, root, manifest);
  validateSourceProvenance(errors, manifest);

  return { ok: errors.length === 0, errors };
}

export function formatStrategyObservationProcessingArtifactManifestValidationReport(report) {
  const lines = [
    "Overlord StrategyObservationProcessingArtifactManifest Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) lines.push(`ERROR ${error}`);
  return lines.join("\n");
}

function validateCoreFields(errors, manifest) {
  if (manifest.schema_version !== "strategy_observation_processing_artifact_manifest.v1") errors.push("schema_version must be strategy_observation_processing_artifact_manifest.v1");
  if (Number.isNaN(Date.parse(manifest.created_at))) errors.push("created_at must be a valid timestamp");
  if (manifest.paper_only !== true) errors.push("paper_only must be true");
  if (manifest.live_execution_allowed !== false) errors.push("live_execution_allowed must be false");
  if (manifest.order_placement_allowed !== false) errors.push("order_placement_allowed must be false");
  if (typeof manifest.strategy_observation_processing_contract_id !== "string" || !manifest.strategy_observation_processing_contract_id.startsWith("sopc_")) errors.push("strategy_observation_processing_contract_id must reference a StrategyObservationProcessingContract id");
  if (typeof manifest.strategy_observation_processing_input_set_id !== "string" || !manifest.strategy_observation_processing_input_set_id.startsWith("sopis_")) errors.push("strategy_observation_processing_input_set_id must reference a StrategyObservationProcessingInputSet id");
  if (manifest.validation_status !== "validation_passed") errors.push("validation_status must be validation_passed");
  if (manifest.status !== "artifact_manifest_ready") errors.push("status must be artifact_manifest_ready");
  if (manifest.reason_code !== observationValidationReasonCodes.VALIDATION_PASSED) errors.push("reason_code must be VALIDATION_PASSED");
}

function validateDeterministicId(errors, manifest) {
  const expected = strategyObservationProcessingArtifactManifestId({
    strategyObservationProcessingContractId: manifest.strategy_observation_processing_contract_id,
    strategyObservationProcessingInputSetId: manifest.strategy_observation_processing_input_set_id,
    artifactCount: Array.isArray(manifest.input_artifacts) ? manifest.input_artifacts.length : undefined,
    hashCount: Array.isArray(manifest.artifact_hashes) ? manifest.artifact_hashes.length : undefined,
    outputArtifactCount: Array.isArray(manifest.processing_output_artifacts) ? manifest.processing_output_artifacts.length : undefined,
    outputHashCount: Array.isArray(manifest.output_artifact_hashes) ? manifest.output_artifact_hashes.length : undefined
  });
  if (manifest.artifact_manifest_id !== expected) errors.push("artifact_manifest_id must be deterministic from processing contract, input set, and artifact counts");
}

async function validateManifestArtifacts(errors, root, manifest) {
  const inputSetReport = await validateStrategyObservationProcessingInputSet({
    strategy_observation_processing_input_set_id: manifest.strategy_observation_processing_input_set_id,
    schema_version: "strategy_observation_processing_input_set.v1",
    generated_at: manifest.created_at,
    paper_only: manifest.paper_only,
    live_execution_allowed: manifest.live_execution_allowed,
    order_placement_allowed: manifest.order_placement_allowed,
    strategy_observation_processing_contract_id: manifest.strategy_observation_processing_contract_id,
    strategy_observation_stack_closeout_checkpoint_id: manifest.source_provenance?.source_strategy_observation_stack_closeout_checkpoint_id,
    source_strategy_observation_stack_closeout_checkpoint_id: manifest.source_provenance?.source_strategy_observation_stack_closeout_checkpoint_id,
    source_strategy_observation_case_file_summary_id: manifest.source_provenance?.source_strategy_observation_case_file_summary_id,
    source_strategy_observation_evidence_bundle_id: manifest.source_provenance?.source_strategy_observation_evidence_bundle_id,
    source_strategy_observation_noop_summary_id: manifest.source_provenance?.source_strategy_observation_noop_summary_id,
    source_strategy_definition_id: manifest.source_provenance?.source_strategy_definition_id,
    source_strategy_run_intent_id: manifest.source_provenance?.source_strategy_run_intent_id,
    replay_mode: "offline_fixture_replay",
    run_mode: "dry_run_planned",
    input_artifacts: manifest.input_artifacts,
    status: "strategy_observation_processing_input_set_ready",
    reason_code: "VALIDATION_PASSED",
    reason: "metadata boundary ready"
  }, { repoRoot: root });
  for (const error of inputSetReport.errors) errors.push(`manifest input_artifacts ${error}`);
}

async function validateHashes(errors, root, manifest) {
  if (!Array.isArray(manifest.artifact_hashes) || manifest.artifact_hashes.length === 0) {
    errors.push("artifact_hashes must be a non-empty array");
    return;
  }
  if (!Array.isArray(manifest.input_artifacts)) return;
  if (manifest.artifact_hashes.length !== manifest.input_artifacts.length) errors.push("artifact_hashes length must match input_artifacts length");

  for (const hash of manifest.artifact_hashes) {
    validateNoUnknownFields(errors, hash, hashFields, "artifact_hash");
    if (typeof hash.sha256 !== "string" || !/^sha256:[a-f0-9]{64}$/u.test(hash.sha256)) errors.push("artifact_hash sha256 must be sha256-prefixed hex");
    await validateSafeStrategyDslArtifactPath(errors, root, hash.artifact_path, "artifact_hash artifact_path");
  }

  try {
    const expected = await hashInputArtifacts(root, manifest.input_artifacts);
    for (const expectedHash of expected) {
      const actual = manifest.artifact_hashes.find((hash) => hash.artifact_type === expectedHash.artifact_type);
      if (!actual) {
        errors.push(`artifact_hashes missing ${expectedHash.artifact_type}`);
      } else if (actual.artifact_path !== expectedHash.artifact_path || actual.sha256 !== expectedHash.sha256) {
        errors.push(`${observationValidationReasonCodes.ERR_HASH_MISMATCH}: artifact_hash must match local snapshot for ${expectedHash.artifact_type}`);
      }
    }
  } catch (error) {
    errors.push(`${observationValidationReasonCodes.ERR_HASH_MISMATCH}: ${error.message}`);
  }
}

function validateOutputArtifacts(errors, manifest) {
  if (!Array.isArray(manifest.processing_output_artifacts) || manifest.processing_output_artifacts.length === 0) {
    errors.push("processing_output_artifacts must be a non-empty array");
    return;
  }
  for (const artifact of manifest.processing_output_artifacts) {
    validateNoUnknownFields(errors, artifact, outputArtifactFields, "processing_output_artifact");
    if (typeof artifact.artifact_type !== "string") errors.push("processing_output_artifact artifact_type must be a string");
    if (typeof artifact.artifact_path !== "string") errors.push("processing_output_artifact artifact_path must be a string");
    if (!Number.isInteger(artifact.record_count) || artifact.record_count < 0) errors.push("processing_output_artifact record_count must be a non-negative integer");
  }
}

async function validateOutputHashes(errors, root, manifest) {
  if (!Array.isArray(manifest.output_artifact_hashes) || manifest.output_artifact_hashes.length === 0) {
    errors.push("output_artifact_hashes must be a non-empty array");
    return;
  }
  if (!Array.isArray(manifest.processing_output_artifacts)) return;
  if (manifest.output_artifact_hashes.length !== manifest.processing_output_artifacts.length) {
    errors.push("output_artifact_hashes length must match processing_output_artifacts length");
  }

  for (const hash of manifest.output_artifact_hashes) {
    validateNoUnknownFields(errors, hash, hashFields, "output_artifact_hash");
    if (typeof hash.sha256 !== "string" || !/^sha256:[a-f0-9]{64}$/u.test(hash.sha256)) errors.push("output_artifact_hash sha256 must be sha256-prefixed hex");
    await validateSafeStrategyDslArtifactPath(errors, root, hash.artifact_path, "output_artifact_hash artifact_path");
  }

  try {
    const expected = await hashInputArtifacts(root, manifest.processing_output_artifacts);
    for (const expectedHash of expected) {
      const actual = manifest.output_artifact_hashes.find((hash) => hash.artifact_type === expectedHash.artifact_type);
      if (!actual) {
        errors.push(`output_artifact_hashes missing ${expectedHash.artifact_type}`);
      } else if (actual.artifact_path !== expectedHash.artifact_path || actual.sha256 !== expectedHash.sha256) {
        errors.push(`${observationValidationReasonCodes.ERR_HASH_MISMATCH}: output_artifact_hash must match local snapshot for ${expectedHash.artifact_type}`);
      }
    }
  } catch (error) {
    errors.push(`${observationValidationReasonCodes.ERR_HASH_MISMATCH}: ${error.message}`);
  }
}

function validateSourceProvenance(errors, manifest) {
  if (!manifest.source_provenance || typeof manifest.source_provenance !== "object" || Array.isArray(manifest.source_provenance)) {
    errors.push("source_provenance must be an object");
    return;
  }
  validateNoUnknownFields(errors, manifest.source_provenance, provenanceFields, "source_provenance");
  for (const field of provenanceFields) {
    if (!Object.hasOwn(manifest.source_provenance, field)) errors.push(`source_provenance ${field} is required`);
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

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const explicitPath = process.argv.find((arg) => arg.endsWith(".json"));
  const report = await validateStrategyObservationProcessingArtifactManifestFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatStrategyObservationProcessingArtifactManifestValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
