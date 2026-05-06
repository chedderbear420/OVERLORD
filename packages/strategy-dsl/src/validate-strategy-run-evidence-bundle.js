import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { resolveLocalArtifactPath } from "../../replay-engine/src/replay-artifact-reader.js";
import { validateForbiddenFields } from "./strategy-contract-rules.js";
import { countStrategyArtifactRecords, strategyArtifactContracts } from "./strategy-run-artifacts.js";
import { strategyRunEvidenceBundleId } from "./strategy-run-evidence-bundle-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_run_evidence_bundle.json");
const requiredFields = [
  "strategy_run_evidence_bundle_id",
  "schema_version",
  "generated_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "strategy_definition_id",
  "strategy_run_intent_id",
  "strategy_run_manifest_id",
  "source_strategy_noop_run_summary_id",
  "source_strategy_definition_path",
  "source_strategy_run_intent_path",
  "source_strategy_run_trace_path",
  "source_strategy_noop_run_summary_path",
  "replay_mode",
  "run_mode",
  "evidence_artifacts",
  "strategy_noop_totals",
  "consistency_checks",
  "status",
  "reason"
];
const requiredArtifactFields = ["artifact_type", "artifact_path", "schema_version", "record_count", "validation_command", "artifact_id"];
const requiredCheckNames = new Set([
  "strategy_definition_id_alignment",
  "strategy_run_intent_id_alignment",
  "trace_totals",
  "input_observation_totals",
  "evidence_artifact_contract_count"
]);
const allowedCheckStatuses = new Set(["check_passed", "check_failed", "check_not_applicable"]);
const allowedStatuses = new Set(["strategy_run_evidence_bundle_ready", "strategy_run_evidence_bundle_rejected"]);
const allowedRunModes = new Set(["validation_only", "dry_run_planned"]);
const contractByType = new Map(strategyArtifactContracts.map((contract) => [contract.artifact_type, contract]));
const expectedPaths = {
  strategy_definition: "packages/strategy-dsl/fixtures/synthetic_strategy_definition.json",
  strategy_run_intent: "packages/strategy-dsl/fixtures/synthetic_strategy_run_intent.json",
  strategy_run_trace: "packages/strategy-dsl/fixtures/synthetic_strategy_run_trace.jsonl",
  strategy_noop_run_summary: "packages/strategy-dsl/fixtures/synthetic_strategy_noop_run_summary.json"
};
const forbiddenCommandPattern = /\b(curl|wget|fetch|powershell|pwsh|invoke-webrequest|invoke-restmethod|iwr|irm)\b|https?:\/\/|[|<>]/i;

export async function validateStrategyRunEvidenceBundleFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let bundle;
  try {
    bundle = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, (await validateStrategyRunEvidenceBundle(bundle, options)).errors);
}

export async function validateStrategyRunEvidenceBundle(bundle, options = {}) {
  const errors = [];
  const root = options.repoRoot ?? repoRoot;

  if (!bundle || typeof bundle !== "object" || Array.isArray(bundle)) {
    return { ok: false, errors: ["StrategyRunEvidenceBundle must be a JSON object"] };
  }
  validateForbiddenFields(errors, bundle);
  for (const field of requiredFields) {
    if (!Object.hasOwn(bundle, field)) errors.push(`${field} is required`);
  }
  if (bundle.schema_version !== "strategy_run_evidence_bundle.v1") errors.push("schema_version must be strategy_run_evidence_bundle.v1");
  if (Number.isNaN(Date.parse(bundle.generated_at))) errors.push("generated_at must be a valid timestamp");
  if (bundle.paper_only !== true) errors.push("paper_only must be true");
  if (bundle.live_execution_allowed !== false) errors.push("live_execution_allowed must be false");
  if (bundle.order_placement_allowed !== false) errors.push("order_placement_allowed must be false");
  if (bundle.replay_mode !== "offline_fixture_replay") errors.push("replay_mode is invalid");
  if (!allowedRunModes.has(bundle.run_mode)) errors.push("run_mode is invalid");
  if (!allowedStatuses.has(bundle.status)) errors.push("status is invalid");
  validateIdShapes(errors, bundle);
  validateDeterministicId(errors, bundle);
  await validateSourcePaths(errors, root, bundle);
  await validateEvidenceArtifacts(errors, root, bundle.evidence_artifacts);
  validateTotals(errors, bundle.strategy_noop_totals, bundle.evidence_artifacts);
  validateConsistencyChecks(errors, bundle.consistency_checks, bundle.status);

  return { ok: errors.length === 0, errors };
}

export function formatStrategyRunEvidenceBundleValidationReport(report) {
  const lines = [
    "Overlord StrategyRunEvidenceBundle Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) lines.push(`ERROR ${error}`);
  return lines.join("\n");
}

function validateIdShapes(errors, bundle) {
  if (typeof bundle.strategy_definition_id !== "string" || !bundle.strategy_definition_id.startsWith("sdef_")) errors.push("strategy_definition_id must reference a StrategyDefinition id");
  if (typeof bundle.strategy_run_intent_id !== "string" || !bundle.strategy_run_intent_id.startsWith("sri_")) errors.push("strategy_run_intent_id must reference a StrategyRunIntent id");
  if (typeof bundle.strategy_run_manifest_id !== "string" || !bundle.strategy_run_manifest_id.startsWith("srm_")) errors.push("strategy_run_manifest_id must reference a StrategyRunManifest id");
  if (typeof bundle.source_strategy_noop_run_summary_id !== "string" || !bundle.source_strategy_noop_run_summary_id.startsWith("sns_")) errors.push("source_strategy_noop_run_summary_id must reference a StrategyNoOpRunSummary id");
}

function validateDeterministicId(errors, bundle) {
  const traceArtifact = Array.isArray(bundle.evidence_artifacts)
    ? bundle.evidence_artifacts.find((artifact) => artifact.artifact_type === "strategy_run_trace")
    : null;
  const expected = strategyRunEvidenceBundleId({
    strategyRunManifestId: bundle.strategy_run_manifest_id,
    strategyDefinitionId: bundle.strategy_definition_id,
    strategyRunIntentId: bundle.strategy_run_intent_id,
    traceCount: traceArtifact?.record_count,
    summaryId: bundle.source_strategy_noop_run_summary_id
  });
  if (bundle.strategy_run_evidence_bundle_id !== expected) {
    errors.push("strategy_run_evidence_bundle_id must be deterministic from strategy run source ids and trace count");
  }
}

async function validateSourcePaths(errors, root, bundle) {
  for (const field of ["source_strategy_definition_path", "source_strategy_run_intent_path", "source_strategy_run_trace_path", "source_strategy_noop_run_summary_path"]) {
    await validateSafePath(errors, root, bundle[field], field);
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
      if (artifact.artifact_path !== expectedPaths[artifact.artifact_type]) errors.push("evidence artifact_path must match the known strategy evidence contract");
      if (artifact.schema_version !== contract.schema_version) errors.push("evidence artifact schema_version must match the known strategy evidence contract");
      if (artifact.validation_command !== contract.validation_command) errors.push("evidence artifact validation_command must match the known strategy evidence contract");
    }
    if (seenTypes.has(artifact.artifact_type)) errors.push("duplicate evidence artifact_type is not allowed");
    seenTypes.add(artifact.artifact_type);
    if (!Number.isInteger(artifact.record_count) || artifact.record_count < 0) errors.push("evidence artifact record_count must be a non-negative integer");
    if (!isSafeLocalNpmCommand(artifact.validation_command)) errors.push("evidence artifact validation_command must be a local npm script");
    await validateSafePath(errors, root, artifact.artifact_path, "evidence artifact_path");
    if (typeof artifact.artifact_path === "string" && Number.isInteger(artifact.record_count)) {
      try {
        const actual = await countStrategyArtifactRecords(root, artifact.artifact_path);
        if (actual !== artifact.record_count) errors.push("evidence artifact record_count must match local fixture count");
      } catch (error) {
        errors.push(`evidence artifact record_count could not be verified: ${error.message}`);
      }
    }
  }
  for (const contract of strategyArtifactContracts) {
    if (!seenTypes.has(contract.artifact_type)) errors.push(`missing required evidence artifact_type: ${contract.artifact_type}`);
  }
}

function validateTotals(errors, totals, artifacts) {
  if (!totals || typeof totals !== "object" || Array.isArray(totals)) {
    errors.push("strategy_noop_totals must be an object");
    return;
  }
  for (const field of ["total_trace_records", "total_inputs_observed"]) {
    if (!Number.isInteger(totals[field]) || totals[field] < 0) errors.push(`strategy_noop_totals ${field} must be a non-negative integer`);
  }
  const traceArtifact = Array.isArray(artifacts) ? artifacts.find((artifact) => artifact.artifact_type === "strategy_run_trace") : null;
  if (traceArtifact && totals.total_trace_records !== traceArtifact.record_count) errors.push("strategy_noop_totals total_trace_records must match strategy_run_trace record_count");
  if (Number.isInteger(totals.total_trace_records) && Number.isInteger(totals.total_inputs_observed) && totals.total_trace_records !== totals.total_inputs_observed + 2) {
    errors.push("strategy_noop_totals total_trace_records must equal total_inputs_observed plus boundary traces");
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
  if (status === "strategy_run_evidence_bundle_ready" && checks.some((check) => check.status === "check_failed")) {
    errors.push("ready strategy run evidence bundles must not contain failed consistency checks");
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
  const report = await validateStrategyRunEvidenceBundleFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatStrategyRunEvidenceBundleValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
