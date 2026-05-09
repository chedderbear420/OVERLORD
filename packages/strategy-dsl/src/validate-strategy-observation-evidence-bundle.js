import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { resolveLocalArtifactPath } from "../../replay-engine/src/replay-artifact-reader.js";
import { validateForbiddenFields } from "./strategy-contract-rules.js";
import {
  countStrategyObservationArtifactRecords,
  defaultStrategyObservationArtifactPaths,
  strategyObservationArtifactContracts
} from "./strategy-observation-artifacts.js";
import { strategyObservationEvidenceBundleId } from "./strategy-observation-evidence-bundle-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_evidence_bundle.json");
const requiredFields = [
  "strategy_observation_evidence_bundle_id",
  "schema_version",
  "generated_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "strategy_observation_contract_id",
  "strategy_observation_input_set_id",
  "strategy_observation_noop_summary_id",
  "strategy_dry_run_stack_closeout_checkpoint_id",
  "strategy_definition_id",
  "strategy_run_intent_id",
  "source_strategy_observation_contract_id",
  "source_strategy_observation_input_set_id",
  "source_strategy_observation_noop_summary_id",
  "source_strategy_dry_run_stack_closeout_checkpoint_id",
  "source_strategy_definition_id",
  "source_strategy_run_intent_id",
  "replay_mode",
  "run_mode",
  "evidence_artifacts",
  "consistency_checks",
  "status",
  "reason"
];
const requiredArtifactFields = ["artifact_type", "artifact_path", "schema_version", "record_count", "validation_command", "artifact_id"];
const requiredCheckNames = new Set([
  "observation_contract_id_alignment",
  "observation_input_set_id_alignment",
  "observation_noop_summary_id_alignment",
  "trace_record_total_alignment",
  "observed_input_total_alignment",
  "evidence_artifact_contract_count"
]);
const allowedCheckStatuses = new Set(["check_passed", "check_failed", "check_not_applicable"]);
const allowedStatuses = new Set(["observation_evidence_bundle_ready", "observation_evidence_bundle_rejected"]);
const allowedRunModes = new Set(["validation_only", "dry_run_planned"]);
const contractByType = new Map(strategyObservationArtifactContracts.map((contract) => [contract.artifact_type, contract]));
const expectedPaths = {
  strategy_observation_contract: defaultStrategyObservationArtifactPaths.observationContractPath,
  strategy_observation_input_set: defaultStrategyObservationArtifactPaths.observationInputSetPath,
  strategy_observation_trace: defaultStrategyObservationArtifactPaths.observationTracePath,
  strategy_observation_noop_summary: defaultStrategyObservationArtifactPaths.observationNoopSummaryPath
};
const forbiddenCommandPattern = /\b(curl|wget|fetch|powershell|pwsh|invoke-webrequest|invoke-restmethod|iwr|irm)\b|https?:\/\/|[|<>]/i;

export async function validateStrategyObservationEvidenceBundleFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let bundle;
  try {
    bundle = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, (await validateStrategyObservationEvidenceBundle(bundle, options)).errors);
}

export async function validateStrategyObservationEvidenceBundle(bundle, options = {}) {
  const errors = [];
  const root = options.repoRoot ?? repoRoot;

  if (!bundle || typeof bundle !== "object" || Array.isArray(bundle)) {
    return { ok: false, errors: ["StrategyObservationEvidenceBundle must be a JSON object"] };
  }
  validateForbiddenFields(errors, bundle);
  for (const field of requiredFields) {
    if (!Object.hasOwn(bundle, field)) errors.push(`${field} is required`);
  }
  validateCoreFields(errors, bundle);
  validateIdShapes(errors, bundle);
  validateDeterministicId(errors, bundle);
  await validateEvidenceArtifacts(errors, root, bundle.evidence_artifacts);
  validateConsistencyChecks(errors, bundle.consistency_checks, bundle.status);

  return { ok: errors.length === 0, errors };
}

export function formatStrategyObservationEvidenceBundleValidationReport(report) {
  const lines = [
    "Overlord StrategyObservationEvidenceBundle Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) lines.push(`ERROR ${error}`);
  return lines.join("\n");
}

function validateCoreFields(errors, bundle) {
  if (bundle.schema_version !== "strategy_observation_evidence_bundle.v1") errors.push("schema_version must be strategy_observation_evidence_bundle.v1");
  if (Number.isNaN(Date.parse(bundle.generated_at))) errors.push("generated_at must be a valid timestamp");
  if (bundle.paper_only !== true) errors.push("paper_only must be true");
  if (bundle.live_execution_allowed !== false) errors.push("live_execution_allowed must be false");
  if (bundle.order_placement_allowed !== false) errors.push("order_placement_allowed must be false");
  if (bundle.replay_mode !== "offline_fixture_replay") errors.push("replay_mode is invalid");
  if (!allowedRunModes.has(bundle.run_mode)) errors.push("run_mode is invalid");
  if (!allowedStatuses.has(bundle.status)) errors.push("status is invalid");
}

function validateIdShapes(errors, bundle) {
  if (typeof bundle.strategy_observation_evidence_bundle_id !== "string" || !bundle.strategy_observation_evidence_bundle_id.startsWith("soeb_")) errors.push("strategy_observation_evidence_bundle_id must reference a StrategyObservationEvidenceBundle id");
  if (typeof bundle.strategy_observation_contract_id !== "string" || !bundle.strategy_observation_contract_id.startsWith("soc_")) errors.push("strategy_observation_contract_id must reference a StrategyObservationContract id");
  if (typeof bundle.strategy_observation_input_set_id !== "string" || !bundle.strategy_observation_input_set_id.startsWith("sois_")) errors.push("strategy_observation_input_set_id must reference a StrategyObservationInputSet id");
  if (typeof bundle.strategy_observation_noop_summary_id !== "string" || !bundle.strategy_observation_noop_summary_id.startsWith("sons_")) errors.push("strategy_observation_noop_summary_id must reference a StrategyObservationNoOpSummary id");
  if (typeof bundle.strategy_dry_run_stack_closeout_checkpoint_id !== "string" || !bundle.strategy_dry_run_stack_closeout_checkpoint_id.startsWith("sdrscc_")) errors.push("strategy_dry_run_stack_closeout_checkpoint_id must reference a StrategyDryRunStackCloseoutCheckpoint id");
  if (typeof bundle.strategy_definition_id !== "string" || !bundle.strategy_definition_id.startsWith("sdef_")) errors.push("strategy_definition_id must reference a StrategyDefinition id");
  if (typeof bundle.strategy_run_intent_id !== "string" || !bundle.strategy_run_intent_id.startsWith("sri_")) errors.push("strategy_run_intent_id must reference a StrategyRunIntent id");
  if (bundle.source_strategy_observation_contract_id !== bundle.strategy_observation_contract_id) errors.push("source_strategy_observation_contract_id must match strategy_observation_contract_id");
  if (bundle.source_strategy_observation_input_set_id !== bundle.strategy_observation_input_set_id) errors.push("source_strategy_observation_input_set_id must match strategy_observation_input_set_id");
  if (bundle.source_strategy_observation_noop_summary_id !== bundle.strategy_observation_noop_summary_id) errors.push("source_strategy_observation_noop_summary_id must match strategy_observation_noop_summary_id");
  if (bundle.source_strategy_dry_run_stack_closeout_checkpoint_id !== bundle.strategy_dry_run_stack_closeout_checkpoint_id) errors.push("source_strategy_dry_run_stack_closeout_checkpoint_id must match strategy_dry_run_stack_closeout_checkpoint_id");
  if (bundle.source_strategy_definition_id !== bundle.strategy_definition_id) errors.push("source_strategy_definition_id must match strategy_definition_id");
  if (bundle.source_strategy_run_intent_id !== bundle.strategy_run_intent_id) errors.push("source_strategy_run_intent_id must match strategy_run_intent_id");
}

function validateDeterministicId(errors, bundle) {
  const traceArtifact = Array.isArray(bundle.evidence_artifacts)
    ? bundle.evidence_artifacts.find((artifact) => artifact.artifact_type === "strategy_observation_trace")
    : null;
  const expected = strategyObservationEvidenceBundleId({
    strategyObservationContractId: bundle.strategy_observation_contract_id,
    strategyObservationInputSetId: bundle.strategy_observation_input_set_id,
    strategyObservationNoopSummaryId: bundle.strategy_observation_noop_summary_id,
    strategyDryRunStackCloseoutCheckpointId: bundle.strategy_dry_run_stack_closeout_checkpoint_id,
    traceCount: traceArtifact?.record_count
  });
  if (bundle.strategy_observation_evidence_bundle_id !== expected) {
    errors.push("strategy_observation_evidence_bundle_id must be deterministic from observation source ids and trace count");
  }
}

async function validateEvidenceArtifacts(errors, root, artifacts) {
  if (!Array.isArray(artifacts) || artifacts.length === 0) {
    errors.push("evidence_artifacts must be a non-empty array");
    return;
  }
  const seenTypes = new Set();
  for (const artifact of artifacts) {
    if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
      errors.push("evidence_artifact must be an object");
      continue;
    }
    for (const field of requiredArtifactFields) {
      if (!Object.hasOwn(artifact, field)) errors.push(`evidence_artifact ${field} is required`);
    }
    const contract = contractByType.get(artifact.artifact_type);
    if (!contract) {
      errors.push("evidence artifact_type is invalid");
    } else {
      if (artifact.artifact_path !== expectedPaths[artifact.artifact_type]) errors.push("evidence artifact_path must match the known observation evidence contract");
      if (artifact.schema_version !== contract.schema_version) errors.push("evidence artifact schema_version must match the known observation evidence contract");
      if (artifact.validation_command !== contract.validation_command) errors.push("evidence artifact validation_command must match the known observation evidence contract");
    }
    if (seenTypes.has(artifact.artifact_type)) errors.push("duplicate evidence artifact_type is not allowed");
    seenTypes.add(artifact.artifact_type);
    if (!Number.isInteger(artifact.record_count) || artifact.record_count < 0) errors.push("evidence artifact record_count must be a non-negative integer");
    if (!isSafeLocalNpmCommand(artifact.validation_command)) errors.push("evidence artifact validation_command must be a local npm script");
    await validateSafePath(errors, root, artifact.artifact_path, "evidence artifact_path");
    if (typeof artifact.artifact_path === "string" && Number.isInteger(artifact.record_count)) {
      try {
        const actual = await countStrategyObservationArtifactRecords(root, artifact.artifact_path);
        if (actual !== artifact.record_count) errors.push("evidence artifact record_count must match local fixture count");
      } catch (error) {
        errors.push(`evidence artifact record_count could not be verified: ${error.message}`);
      }
    }
  }
  for (const contract of strategyObservationArtifactContracts) {
    if (!seenTypes.has(contract.artifact_type)) errors.push(`missing required evidence artifact_type: ${contract.artifact_type}`);
  }
}

function validateConsistencyChecks(errors, checks, status) {
  if (!Array.isArray(checks) || checks.length === 0) {
    errors.push("consistency_checks must be a non-empty array");
    return;
  }
  const seen = new Set();
  for (const check of checks) {
    if (!check || typeof check !== "object" || Array.isArray(check)) {
      errors.push("consistency_check must be an object");
      continue;
    }
    for (const field of ["check_name", "status", "reason"]) {
      if (!Object.hasOwn(check, field)) errors.push(`consistency_check ${field} is required`);
    }
    if (seen.has(check.check_name)) errors.push("duplicate consistency_check name is not allowed");
    seen.add(check.check_name);
    if (!allowedCheckStatuses.has(check.status)) errors.push("consistency_check status is invalid");
  }
  for (const checkName of requiredCheckNames) {
    if (!seen.has(checkName)) errors.push(`missing required consistency_check: ${checkName}`);
  }
  if (status === "observation_evidence_bundle_ready" && checks.some((check) => check.status === "check_failed")) {
    errors.push("ready observation evidence bundles must not contain failed consistency checks");
  }
  if (status === "observation_evidence_bundle_ready" && checks.some((check) => requiredCheckNames.has(check.check_name) && check.status !== "check_passed")) {
    errors.push("ready observation evidence bundles require all required consistency checks to pass");
  }
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
  return { ok: errors.length === 0, filePath: path.relative(repoRoot, filePath).replaceAll("\\", "/"), errors };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const explicitPath = process.argv.find((arg) => arg.endsWith(".json"));
  const report = await validateStrategyObservationEvidenceBundleFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatStrategyObservationEvidenceBundleValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
