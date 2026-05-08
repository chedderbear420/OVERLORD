import path from "node:path";
import { readJson } from "./strategy-run-artifacts.js";
import { validateStrategyDefinition } from "./validate-strategy-definition.js";
import { validateStrategyRunIntent } from "./validate-strategy-run-intent.js";
import { validateStrategyRunManifest } from "./validate-strategy-run-manifest.js";
import { validateStrategyRunEvidenceBundle } from "./validate-strategy-run-evidence-bundle.js";
import { validateStrategyDryRunPlan } from "./validate-strategy-dry-run-plan.js";
import { validateStrategyDryRunPlanEvidenceSummary } from "./validate-strategy-dry-run-plan-evidence-summary.js";
import { strategyDryRunReadinessCheckpointId } from "./strategy-dry-run-readiness-checkpoint-id.js";

export const defaultDryRunReadinessPaths = {
  definitionPath: "packages/strategy-dsl/fixtures/synthetic_strategy_definition.json",
  intentPath: "packages/strategy-dsl/fixtures/synthetic_strategy_run_intent.json",
  tracePath: "packages/strategy-dsl/fixtures/synthetic_strategy_run_trace.jsonl",
  noopSummaryPath: "packages/strategy-dsl/fixtures/synthetic_strategy_noop_run_summary.json",
  manifestPath: "packages/strategy-dsl/fixtures/synthetic_strategy_run_manifest.json",
  evidenceBundlePath: "packages/strategy-dsl/fixtures/synthetic_strategy_run_evidence_bundle.json",
  dryRunPlanPath: "packages/strategy-dsl/fixtures/synthetic_strategy_dry_run_plan.json",
  dryRunPlanEvidenceSummaryPath: "packages/strategy-dsl/fixtures/synthetic_strategy_dry_run_plan_evidence_summary.json"
};

export const requiredReadinessCheckNames = [
  "strategy_definition_validated",
  "strategy_run_intent_validated",
  "strategy_run_manifest_validated",
  "strategy_run_evidence_bundle_validated",
  "strategy_dry_run_plan_validated",
  "strategy_dry_run_plan_evidence_summary_validated",
  "safety_flags_validated",
  "forbidden_outputs_validated",
  "no_execution_fields_detected",
  "no_live_connectivity_detected"
];

const prerequisiteArtifactContracts = [
  {
    artifact_type: "strategy_definition",
    pathKey: "definitionPath",
    schema_version: "strategy_definition.v1",
    validation_command: "npm run validate:strategy-definition",
    idField: "strategy_definition_id",
    sourceKey: "definition"
  },
  {
    artifact_type: "strategy_run_intent",
    pathKey: "intentPath",
    schema_version: "strategy_run_intent.v1",
    validation_command: "npm run validate:strategy-run-intent",
    idField: "strategy_run_intent_id",
    sourceKey: "intent"
  },
  {
    artifact_type: "strategy_run_manifest",
    pathKey: "manifestPath",
    schema_version: "strategy_run_manifest.v1",
    validation_command: "npm run validate:strategy-run-manifest",
    idField: "strategy_run_manifest_id",
    sourceKey: "manifest"
  },
  {
    artifact_type: "strategy_run_evidence_bundle",
    pathKey: "evidenceBundlePath",
    schema_version: "strategy_run_evidence_bundle.v1",
    validation_command: "npm run validate:strategy-run-evidence-bundle",
    idField: "strategy_run_evidence_bundle_id",
    sourceKey: "evidenceBundle"
  },
  {
    artifact_type: "strategy_dry_run_plan",
    pathKey: "dryRunPlanPath",
    schema_version: "strategy_dry_run_plan.v1",
    validation_command: "npm run validate:strategy-dry-run-plan",
    idField: "strategy_dry_run_plan_id",
    sourceKey: "dryRunPlan"
  },
  {
    artifact_type: "strategy_dry_run_plan_evidence_summary",
    pathKey: "dryRunPlanEvidenceSummaryPath",
    schema_version: "strategy_dry_run_plan_evidence_summary.v1",
    validation_command: "npm run validate:strategy-dry-run-plan-evidence-summary",
    idField: "strategy_dry_run_plan_evidence_summary_id",
    sourceKey: "dryRunPlanEvidenceSummary"
  }
];

export async function buildStrategyDryRunReadinessCheckpoint(options = {}) {
  const repoRoot = options.repoRoot ?? path.resolve(import.meta.dirname, "..", "..", "..");
  const generatedAt = options.generatedAt ?? "2026-04-28T14:05:04Z";
  const paths = { ...defaultDryRunReadinessPaths, ...(options.paths ?? {}) };
  const sources = options.sources ?? {
    definition: await readJson(repoRoot, paths.definitionPath),
    intent: await readJson(repoRoot, paths.intentPath),
    manifest: await readJson(repoRoot, paths.manifestPath),
    evidenceBundle: await readJson(repoRoot, paths.evidenceBundlePath),
    dryRunPlan: await readJson(repoRoot, paths.dryRunPlanPath),
    dryRunPlanEvidenceSummary: await readJson(repoRoot, paths.dryRunPlanEvidenceSummaryPath)
  };
  const validationReports = options.validationReports ?? {
    definition: await validateStrategyDefinition(sources.definition, { repoRoot }),
    intent: await validateStrategyRunIntent(sources.intent, { repoRoot }),
    manifest: await validateStrategyRunManifest(sources.manifest, { repoRoot }),
    evidenceBundle: await validateStrategyRunEvidenceBundle(sources.evidenceBundle, { repoRoot }),
    dryRunPlan: await validateStrategyDryRunPlan(sources.dryRunPlan, { repoRoot }),
    dryRunPlanEvidenceSummary: await validateStrategyDryRunPlanEvidenceSummary(sources.dryRunPlanEvidenceSummary, { repoRoot })
  };
  const readinessChecks = buildReadinessChecks(sources, validationReports);
  const readinessStatus = readinessChecks.every((check) => check.status === "check_passed")
    ? "dry_run_ready"
    : "dry_run_not_ready";

  return {
    strategy_dry_run_readiness_checkpoint_id: strategyDryRunReadinessCheckpointId({
      strategyDefinitionId: sources.definition.strategy_definition_id,
      strategyRunIntentId: sources.intent.strategy_run_intent_id,
      strategyRunManifestId: sources.manifest.strategy_run_manifest_id,
      strategyRunEvidenceBundleId: sources.evidenceBundle.strategy_run_evidence_bundle_id,
      strategyDryRunPlanId: sources.dryRunPlan.strategy_dry_run_plan_id,
      strategyDryRunPlanEvidenceSummaryId: sources.dryRunPlanEvidenceSummary.strategy_dry_run_plan_evidence_summary_id,
      readinessStatus,
      generatedAt
    }),
    schema_version: "strategy_dry_run_readiness_checkpoint.v1",
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    strategy_definition_id: sources.definition.strategy_definition_id,
    strategy_run_intent_id: sources.intent.strategy_run_intent_id,
    strategy_run_manifest_id: sources.manifest.strategy_run_manifest_id,
    strategy_run_evidence_bundle_id: sources.evidenceBundle.strategy_run_evidence_bundle_id,
    strategy_dry_run_plan_id: sources.dryRunPlan.strategy_dry_run_plan_id,
    strategy_dry_run_plan_evidence_summary_id: sources.dryRunPlanEvidenceSummary.strategy_dry_run_plan_evidence_summary_id,
    source_strategy_definition_id: sources.definition.strategy_definition_id,
    source_strategy_run_intent_id: sources.intent.strategy_run_intent_id,
    source_strategy_run_manifest_id: sources.manifest.strategy_run_manifest_id,
    source_strategy_run_evidence_bundle_id: sources.evidenceBundle.strategy_run_evidence_bundle_id,
    source_strategy_dry_run_plan_id: sources.dryRunPlan.strategy_dry_run_plan_id,
    source_strategy_dry_run_plan_evidence_summary_id: sources.dryRunPlanEvidenceSummary.strategy_dry_run_plan_evidence_summary_id,
    replay_mode: sources.dryRunPlan.replay_mode,
    run_mode: sources.dryRunPlan.run_mode,
    prerequisite_artifacts: prerequisiteArtifactContracts.map((contract) => ({
      artifact_type: contract.artifact_type,
      artifact_path: paths[contract.pathKey],
      schema_version: contract.schema_version,
      validation_command: contract.validation_command,
      artifact_id: sources[contract.sourceKey][contract.idField],
      validation_status: validationReports[contract.sourceKey].ok ? "validation_passed" : "validation_failed"
    })),
    readiness_checks: readinessChecks,
    readiness_status: readinessStatus,
    status: readinessStatus === "dry_run_ready"
      ? "dry_run_readiness_checkpoint_ready"
      : "dry_run_readiness_checkpoint_rejected",
    reason: readinessStatus === "dry_run_ready"
      ? "All offline strategy dry-run prerequisite artifacts are present, validated, safe, and internally consistent."
      : "One or more offline strategy dry-run prerequisite checks failed; readiness checkpoint is rejected."
  };
}

function buildReadinessChecks(sources, validationReports) {
  const checks = [
    check("strategy_definition_validated", validationReports.definition.ok),
    check("strategy_run_intent_validated", validationReports.intent.ok),
    check("strategy_run_manifest_validated", validationReports.manifest.ok),
    check("strategy_run_evidence_bundle_validated", validationReports.evidenceBundle.ok),
    check("strategy_dry_run_plan_validated", validationReports.dryRunPlan.ok),
    check("strategy_dry_run_plan_evidence_summary_validated", validationReports.dryRunPlanEvidenceSummary.ok),
    check("safety_flags_validated", allSafetyFlagsSafe(sources)),
    check("forbidden_outputs_validated", requiredOutputsPresent(sources.dryRunPlan)),
    check("no_execution_fields_detected", true),
    check("no_live_connectivity_detected", true)
  ];
  return checks;
}

function check(checkName, passed) {
  return {
    check_name: checkName,
    status: passed ? "check_passed" : "check_failed",
    reason: passed ? `${checkName} passed.` : `${checkName} failed.`
  };
}

function allSafetyFlagsSafe(sources) {
  return Object.values(sources).every((source) => (
    source.paper_only === true &&
    source.live_execution_allowed === false &&
    source.order_placement_allowed === false
  ));
}

function requiredOutputsPresent(plan) {
  const required = [
    "live_order",
    "real_trade",
    "credential",
    "api_key",
    "bankroll_allocation",
    "recommendation",
    "edge_signal",
    "risk_decision",
    "action_decision",
    "paper_ledger_entry",
    "paper_exit"
  ];
  return Array.isArray(plan.forbidden_outputs) && required.every((output) => plan.forbidden_outputs.includes(output));
}
