import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { resolveLocalArtifactPath } from "../../replay-engine/src/replay-artifact-reader.js";
import { validateForbiddenFields } from "./strategy-contract-rules.js";
import {
  allowedDryRunInputArtifacts,
  allowedDryRunStepTypes,
  requiredDryRunForbiddenOutputs,
  requiredDryRunSafetyConstraints
} from "./build-strategy-dry-run-plan.js";
import { strategyDryRunPlanId } from "./strategy-dry-run-plan-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_dry_run_plan.json");
const requiredFields = [
  "strategy_dry_run_plan_id",
  "schema_version",
  "generated_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "strategy_definition_id",
  "strategy_run_intent_id",
  "strategy_run_manifest_id",
  "strategy_run_evidence_bundle_id",
  "source_strategy_definition_id",
  "source_strategy_run_intent_id",
  "source_strategy_run_manifest_id",
  "source_strategy_run_evidence_bundle_id",
  "replay_mode",
  "run_mode",
  "allowed_input_artifacts",
  "forbidden_outputs",
  "planned_observation_steps",
  "safety_constraints",
  "status",
  "reason"
];
const requiredArtifactFields = ["artifact_type", "artifact_path", "access_mode"];
const allowedStatuses = new Set(["strategy_dry_run_plan_ready", "strategy_dry_run_plan_rejected"]);
const allowedRunModes = new Set(["validation_only", "dry_run_planned"]);
const allowedReplayModes = new Set(["offline_fixture_replay"]);
const allowedArtifactTypes = new Set(allowedDryRunInputArtifacts);
const allowedStepTypes = new Set(allowedDryRunStepTypes);
const forbiddenStepTypes = new Set([
  "execute_strategy",
  "calculate_edge",
  "generate_signal",
  "generate_risk_decision",
  "generate_action_decision",
  "create_paper_entry",
  "create_paper_exit",
  "recommend_trade",
  "place_order"
]);

export async function validateStrategyDryRunPlanFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let plan;
  try {
    plan = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, (await validateStrategyDryRunPlan(plan, options)).errors);
}

export async function validateStrategyDryRunPlan(plan, options = {}) {
  const errors = [];
  const root = options.repoRoot ?? repoRoot;

  if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
    return { ok: false, errors: ["StrategyDryRunPlan must be a JSON object"] };
  }
  validateForbiddenFields(errors, plan);
  for (const field of requiredFields) {
    if (!Object.hasOwn(plan, field)) errors.push(`${field} is required`);
  }
  validateCoreFields(errors, plan);
  validateIdShapes(errors, plan);
  validateDeterministicId(errors, plan);
  await validateAllowedInputArtifacts(errors, root, plan.allowed_input_artifacts);
  validateForbiddenOutputs(errors, plan.forbidden_outputs);
  validatePlannedObservationSteps(errors, plan.planned_observation_steps);
  validateSafetyConstraints(errors, plan.safety_constraints);

  return { ok: errors.length === 0, errors };
}

export function formatStrategyDryRunPlanValidationReport(report) {
  const lines = [
    "Overlord StrategyDryRunPlan Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) lines.push(`ERROR ${error}`);
  return lines.join("\n");
}

function validateCoreFields(errors, plan) {
  if (plan.schema_version !== "strategy_dry_run_plan.v1") errors.push("schema_version must be strategy_dry_run_plan.v1");
  if (Number.isNaN(Date.parse(plan.generated_at))) errors.push("generated_at must be a valid timestamp");
  if (plan.paper_only !== true) errors.push("paper_only must be true");
  if (plan.live_execution_allowed !== false) errors.push("live_execution_allowed must be false");
  if (plan.order_placement_allowed !== false) errors.push("order_placement_allowed must be false");
  if (!allowedReplayModes.has(plan.replay_mode)) errors.push("replay_mode is invalid");
  if (!allowedRunModes.has(plan.run_mode)) errors.push("run_mode is invalid");
  if (!allowedStatuses.has(plan.status)) errors.push("status is invalid");
}

function validateIdShapes(errors, plan) {
  if (typeof plan.strategy_definition_id !== "string" || !plan.strategy_definition_id.startsWith("sdef_")) errors.push("strategy_definition_id must reference a StrategyDefinition id");
  if (typeof plan.strategy_run_intent_id !== "string" || !plan.strategy_run_intent_id.startsWith("sri_")) errors.push("strategy_run_intent_id must reference a StrategyRunIntent id");
  if (typeof plan.strategy_run_manifest_id !== "string" || !plan.strategy_run_manifest_id.startsWith("srm_")) errors.push("strategy_run_manifest_id must reference a StrategyRunManifest id");
  if (typeof plan.strategy_run_evidence_bundle_id !== "string" || !plan.strategy_run_evidence_bundle_id.startsWith("sreb_")) errors.push("strategy_run_evidence_bundle_id must reference a StrategyRunEvidenceBundle id");
  if (plan.source_strategy_definition_id !== plan.strategy_definition_id) errors.push("source_strategy_definition_id must match strategy_definition_id");
  if (plan.source_strategy_run_intent_id !== plan.strategy_run_intent_id) errors.push("source_strategy_run_intent_id must match strategy_run_intent_id");
  if (plan.source_strategy_run_manifest_id !== plan.strategy_run_manifest_id) errors.push("source_strategy_run_manifest_id must match strategy_run_manifest_id");
  if (plan.source_strategy_run_evidence_bundle_id !== plan.strategy_run_evidence_bundle_id) errors.push("source_strategy_run_evidence_bundle_id must match strategy_run_evidence_bundle_id");
}

function validateDeterministicId(errors, plan) {
  const expected = strategyDryRunPlanId({
    strategyDefinitionId: plan.strategy_definition_id,
    strategyRunIntentId: plan.strategy_run_intent_id,
    strategyRunManifestId: plan.strategy_run_manifest_id,
    strategyRunEvidenceBundleId: plan.strategy_run_evidence_bundle_id,
    generatedAt: plan.generated_at
  });
  if (plan.strategy_dry_run_plan_id !== expected) errors.push("strategy_dry_run_plan_id must be deterministic from strategy source ids and generated_at");
}

async function validateAllowedInputArtifacts(errors, root, artifacts) {
  if (!Array.isArray(artifacts) || artifacts.length === 0) {
    errors.push("allowed_input_artifacts must be a non-empty array");
    return;
  }
  const seenTypes = new Set();
  for (const artifact of artifacts) {
    if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
      errors.push("allowed_input_artifact must be an object");
      continue;
    }
    for (const field of requiredArtifactFields) {
      if (!Object.hasOwn(artifact, field)) errors.push(`allowed_input_artifact ${field} is required`);
    }
    if (!allowedArtifactTypes.has(artifact.artifact_type)) errors.push("allowed_input artifact_type is invalid");
    if (seenTypes.has(artifact.artifact_type)) errors.push("duplicate allowed_input artifact_type is not allowed");
    seenTypes.add(artifact.artifact_type);
    if (artifact.access_mode !== "read_only") errors.push("allowed_input access_mode must be read_only");
    await validateSafePath(errors, root, artifact.artifact_path, "allowed_input artifact_path");
  }
}

function validateForbiddenOutputs(errors, forbiddenOutputs) {
  if (!Array.isArray(forbiddenOutputs) || forbiddenOutputs.length === 0) {
    errors.push("forbidden_outputs must be a non-empty array");
    return;
  }
  for (const output of requiredDryRunForbiddenOutputs) {
    if (!forbiddenOutputs.includes(output)) errors.push(`forbidden_outputs must include ${output}`);
  }
}

function validatePlannedObservationSteps(errors, steps) {
  if (!Array.isArray(steps) || steps.length === 0) {
    errors.push("planned_observation_steps must be a non-empty array");
    return;
  }
  const seenIndexes = new Set();
  for (const [index, step] of steps.entries()) {
    if (!step || typeof step !== "object" || Array.isArray(step)) {
      errors.push("planned_observation_step must be an object");
      continue;
    }
    for (const field of ["step_index", "step_type", "reads", "metadata_only"]) {
      if (!Object.hasOwn(step, field)) errors.push(`planned_observation_step ${field} is required`);
    }
    if (seenIndexes.has(step.step_index)) errors.push("planned_observation_step indexes must be unique");
    seenIndexes.add(step.step_index);
    if (step.step_index !== index) errors.push("planned_observation_step indexes must be sequential");
    if (!allowedStepTypes.has(step.step_type)) errors.push("planned_observation_step step_type is invalid");
    if (forbiddenStepTypes.has(step.step_type)) errors.push("planned_observation_step step_type is forbidden");
    if (step.metadata_only !== true) errors.push("planned_observation_step metadata_only must be true");
    if (!Array.isArray(step.reads) || step.reads.length === 0) {
      errors.push("planned_observation_step reads must be a non-empty array");
    } else {
      for (const artifactType of step.reads) {
        if (!allowedArtifactTypes.has(artifactType)) errors.push("planned_observation_step reads contains invalid artifact type");
      }
    }
  }
}

function validateSafetyConstraints(errors, constraints) {
  if (!Array.isArray(constraints) || constraints.length === 0) {
    errors.push("safety_constraints must be a non-empty array");
    return;
  }
  for (const constraint of requiredDryRunSafetyConstraints) {
    if (!constraints.includes(constraint)) errors.push(`safety_constraints must include ${constraint}`);
  }
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
  const report = await validateStrategyDryRunPlanFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatStrategyDryRunPlanValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
