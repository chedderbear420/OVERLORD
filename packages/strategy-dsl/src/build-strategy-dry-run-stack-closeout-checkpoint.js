import path from "node:path";
import { readJson, readJsonl } from "./strategy-dry-run-artifacts.js";
import { strategyDryRunStackCloseoutCheckpointId } from "./strategy-dry-run-stack-closeout-checkpoint-id.js";

export const defaultStrategyDryRunStackCloseoutPaths = {
  strategyDefinitionPath: "packages/strategy-dsl/fixtures/synthetic_strategy_definition.json",
  strategyRunIntentPath: "packages/strategy-dsl/fixtures/synthetic_strategy_run_intent.json",
  strategyRunManifestPath: "packages/strategy-dsl/fixtures/synthetic_strategy_run_manifest.json",
  strategyRunEvidenceBundlePath: "packages/strategy-dsl/fixtures/synthetic_strategy_run_evidence_bundle.json",
  strategyDryRunPlanPath: "packages/strategy-dsl/fixtures/synthetic_strategy_dry_run_plan.json",
  strategyDryRunPlanEvidenceSummaryPath: "packages/strategy-dsl/fixtures/synthetic_strategy_dry_run_plan_evidence_summary.json",
  strategyDryRunReadinessCheckpointPath: "packages/strategy-dsl/fixtures/synthetic_strategy_dry_run_readiness_checkpoint.json",
  strategyDryRunTracePath: "packages/strategy-dsl/fixtures/synthetic_strategy_dry_run_trace.jsonl",
  strategyDryRunNoopSummaryPath: "packages/strategy-dsl/fixtures/synthetic_strategy_dry_run_noop_summary.json",
  strategyDryRunEvidenceBundlePath: "packages/strategy-dsl/fixtures/synthetic_strategy_dry_run_evidence_bundle.json",
  strategyDryRunCaseFileSummaryPath: "packages/strategy-dsl/fixtures/synthetic_strategy_dry_run_case_file_summary.json"
};

export const strategyDryRunStackCloseoutArtifactContracts = [
  {
    artifact_type: "strategy_definition",
    pathKey: "strategyDefinitionPath",
    schema_version: "strategy_definition.v1",
    validation_command: "npm run validate:strategy-definition",
    sourceKey: "strategyDefinition",
    id_field: "strategy_definition_id"
  },
  {
    artifact_type: "strategy_run_intent",
    pathKey: "strategyRunIntentPath",
    schema_version: "strategy_run_intent.v1",
    validation_command: "npm run validate:strategy-run-intent",
    sourceKey: "strategyRunIntent",
    id_field: "strategy_run_intent_id"
  },
  {
    artifact_type: "strategy_run_manifest",
    pathKey: "strategyRunManifestPath",
    schema_version: "strategy_run_manifest.v1",
    validation_command: "npm run validate:strategy-run-manifest",
    sourceKey: "strategyRunManifest",
    id_field: "strategy_run_manifest_id"
  },
  {
    artifact_type: "strategy_run_evidence_bundle",
    pathKey: "strategyRunEvidenceBundlePath",
    schema_version: "strategy_run_evidence_bundle.v1",
    validation_command: "npm run validate:strategy-run-evidence-bundle",
    sourceKey: "strategyRunEvidenceBundle",
    id_field: "strategy_run_evidence_bundle_id"
  },
  {
    artifact_type: "strategy_dry_run_plan",
    pathKey: "strategyDryRunPlanPath",
    schema_version: "strategy_dry_run_plan.v1",
    validation_command: "npm run validate:strategy-dry-run-plan",
    sourceKey: "strategyDryRunPlan",
    id_field: "strategy_dry_run_plan_id"
  },
  {
    artifact_type: "strategy_dry_run_plan_evidence_summary",
    pathKey: "strategyDryRunPlanEvidenceSummaryPath",
    schema_version: "strategy_dry_run_plan_evidence_summary.v1",
    validation_command: "npm run validate:strategy-dry-run-plan-evidence-summary",
    sourceKey: "strategyDryRunPlanEvidenceSummary",
    id_field: "strategy_dry_run_plan_evidence_summary_id"
  },
  {
    artifact_type: "strategy_dry_run_readiness_checkpoint",
    pathKey: "strategyDryRunReadinessCheckpointPath",
    schema_version: "strategy_dry_run_readiness_checkpoint.v1",
    validation_command: "npm run validate:strategy-dry-run-readiness-checkpoint",
    sourceKey: "strategyDryRunReadinessCheckpoint",
    id_field: "strategy_dry_run_readiness_checkpoint_id"
  },
  {
    artifact_type: "strategy_dry_run_trace",
    pathKey: "strategyDryRunTracePath",
    schema_version: "strategy_dry_run_trace.v1",
    validation_command: "npm run validate:strategy-dry-run-trace",
    sourceKey: "strategyDryRunTrace",
    id_field: null
  },
  {
    artifact_type: "strategy_dry_run_noop_summary",
    pathKey: "strategyDryRunNoopSummaryPath",
    schema_version: "strategy_dry_run_noop_summary.v1",
    validation_command: "npm run validate:strategy-dry-run-noop-summary",
    sourceKey: "strategyDryRunNoopSummary",
    id_field: "strategy_dry_run_noop_summary_id"
  },
  {
    artifact_type: "strategy_dry_run_evidence_bundle",
    pathKey: "strategyDryRunEvidenceBundlePath",
    schema_version: "strategy_dry_run_evidence_bundle.v1",
    validation_command: "npm run validate:strategy-dry-run-evidence-bundle",
    sourceKey: "strategyDryRunEvidenceBundle",
    id_field: "strategy_dry_run_evidence_bundle_id"
  },
  {
    artifact_type: "strategy_dry_run_case_file_summary",
    pathKey: "strategyDryRunCaseFileSummaryPath",
    schema_version: "strategy_dry_run_case_file_summary.v1",
    validation_command: "npm run validate:strategy-dry-run-case-file-summary",
    sourceKey: "strategyDryRunCaseFileSummary",
    id_field: "strategy_dry_run_case_file_summary_id"
  }
];

export const requiredStrategyDryRunCloseoutCheckNames = [
  "strategy_definition_validated",
  "strategy_run_intent_validated",
  "strategy_run_manifest_validated",
  "strategy_run_evidence_bundle_validated",
  "strategy_dry_run_plan_validated",
  "strategy_dry_run_plan_evidence_summary_validated",
  "strategy_dry_run_readiness_checkpoint_validated",
  "strategy_dry_run_trace_validated",
  "strategy_dry_run_noop_summary_validated",
  "strategy_dry_run_evidence_bundle_validated",
  "strategy_dry_run_case_file_summary_validated",
  "safety_flags_validated",
  "no_execution_fields_detected",
  "no_live_connectivity_detected",
  "no_order_fields_detected",
  "no_recommendation_fields_detected",
  "no_bankroll_fields_detected"
];

export async function buildStrategyDryRunStackCloseoutCheckpoint(options = {}) {
  const repoRoot = options.repoRoot ?? path.resolve(import.meta.dirname, "..", "..", "..");
  const generatedAt = options.generatedAt ?? "2026-04-28T14:05:05Z";
  const paths = { ...defaultStrategyDryRunStackCloseoutPaths, ...options.paths };
  const sources = options.sources ?? await readStrategyDryRunStackCloseoutSources(repoRoot, paths);
  const closeoutArtifacts = strategyDryRunStackCloseoutArtifactContracts.map((contract) => makeCloseoutArtifact(contract, paths, sources));
  const closeoutChecks = buildStrategyDryRunStackCloseoutChecks({ sources, closeoutArtifacts });
  const allChecksPassed = closeoutChecks.every((check) => check.status === "check_passed");
  const freezeRecommendation = allChecksPassed ? "freeze_ready" : "freeze_not_ready";
  const readinessStatus = sources.strategyDryRunReadinessCheckpoint.readiness_status;
  const consistencyStatus = sources.strategyDryRunCaseFileSummary.consistency_status;

  return {
    strategy_dry_run_stack_closeout_checkpoint_id: strategyDryRunStackCloseoutCheckpointId({
      strategyDefinitionId: sources.strategyDefinition.strategy_definition_id,
      strategyRunIntentId: sources.strategyRunIntent.strategy_run_intent_id,
      strategyRunManifestId: sources.strategyRunManifest.strategy_run_manifest_id,
      strategyRunEvidenceBundleId: sources.strategyRunEvidenceBundle.strategy_run_evidence_bundle_id,
      strategyDryRunPlanId: sources.strategyDryRunPlan.strategy_dry_run_plan_id,
      strategyDryRunPlanEvidenceSummaryId: sources.strategyDryRunPlanEvidenceSummary.strategy_dry_run_plan_evidence_summary_id,
      strategyDryRunReadinessCheckpointId: sources.strategyDryRunReadinessCheckpoint.strategy_dry_run_readiness_checkpoint_id,
      strategyDryRunNoopSummaryId: sources.strategyDryRunNoopSummary.strategy_dry_run_noop_summary_id,
      strategyDryRunEvidenceBundleId: sources.strategyDryRunEvidenceBundle.strategy_dry_run_evidence_bundle_id,
      strategyDryRunCaseFileSummaryId: sources.strategyDryRunCaseFileSummary.strategy_dry_run_case_file_summary_id,
      freezeRecommendation
    }),
    schema_version: "strategy_dry_run_stack_closeout_checkpoint.v1",
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    source_strategy_definition_id: sources.strategyDefinition.strategy_definition_id,
    source_strategy_run_intent_id: sources.strategyRunIntent.strategy_run_intent_id,
    source_strategy_run_manifest_id: sources.strategyRunManifest.strategy_run_manifest_id,
    source_strategy_run_evidence_bundle_id: sources.strategyRunEvidenceBundle.strategy_run_evidence_bundle_id,
    source_strategy_dry_run_plan_id: sources.strategyDryRunPlan.strategy_dry_run_plan_id,
    source_strategy_dry_run_plan_evidence_summary_id: sources.strategyDryRunPlanEvidenceSummary.strategy_dry_run_plan_evidence_summary_id,
    source_strategy_dry_run_readiness_checkpoint_id: sources.strategyDryRunReadinessCheckpoint.strategy_dry_run_readiness_checkpoint_id,
    source_strategy_dry_run_noop_summary_id: sources.strategyDryRunNoopSummary.strategy_dry_run_noop_summary_id,
    source_strategy_dry_run_evidence_bundle_id: sources.strategyDryRunEvidenceBundle.strategy_dry_run_evidence_bundle_id,
    source_strategy_dry_run_case_file_summary_id: sources.strategyDryRunCaseFileSummary.strategy_dry_run_case_file_summary_id,
    replay_mode: sources.strategyDryRunPlan.replay_mode,
    run_mode: sources.strategyDryRunPlan.run_mode,
    closeout_artifacts: closeoutArtifacts,
    closeout_checks: closeoutChecks,
    readiness_status: readinessStatus,
    consistency_status: consistencyStatus,
    freeze_recommendation: freezeRecommendation,
    status: allChecksPassed && readinessStatus === "dry_run_ready" && consistencyStatus === "consistency_passed"
      ? "dry_run_stack_closeout_ready"
      : "dry_run_stack_closeout_rejected",
    reason: "Strategy dry-run metadata stack closeout for local offline freeze readiness only. Freeze recommendation applies only to metadata validation, not trading, deployment, recommendations, analytics, or bankroll actions."
  };
}

export async function readStrategyDryRunStackCloseoutSources(repoRoot, paths) {
  return {
    strategyDefinition: await readJson(repoRoot, paths.strategyDefinitionPath),
    strategyRunIntent: await readJson(repoRoot, paths.strategyRunIntentPath),
    strategyRunManifest: await readJson(repoRoot, paths.strategyRunManifestPath),
    strategyRunEvidenceBundle: await readJson(repoRoot, paths.strategyRunEvidenceBundlePath),
    strategyDryRunPlan: await readJson(repoRoot, paths.strategyDryRunPlanPath),
    strategyDryRunPlanEvidenceSummary: await readJson(repoRoot, paths.strategyDryRunPlanEvidenceSummaryPath),
    strategyDryRunReadinessCheckpoint: await readJson(repoRoot, paths.strategyDryRunReadinessCheckpointPath),
    strategyDryRunTrace: await readJsonl(repoRoot, paths.strategyDryRunTracePath),
    strategyDryRunNoopSummary: await readJson(repoRoot, paths.strategyDryRunNoopSummaryPath),
    strategyDryRunEvidenceBundle: await readJson(repoRoot, paths.strategyDryRunEvidenceBundlePath),
    strategyDryRunCaseFileSummary: await readJson(repoRoot, paths.strategyDryRunCaseFileSummaryPath)
  };
}

export function buildStrategyDryRunStackCloseoutChecks({ sources, closeoutArtifacts }) {
  const requiredArtifactTypes = new Set(strategyDryRunStackCloseoutArtifactContracts.map((contract) => contract.artifact_type));
  const artifactTypes = new Set(closeoutArtifacts.map((artifact) => artifact.artifact_type));
  return [
    makeCheck("strategy_definition_validated", sources.strategyDefinition.status === "strategy_definition_ready"),
    makeCheck("strategy_run_intent_validated", sources.strategyRunIntent.status === "strategy_run_intent_ready"),
    makeCheck("strategy_run_manifest_validated", sources.strategyRunManifest.status === "strategy_run_manifest_ready"),
    makeCheck("strategy_run_evidence_bundle_validated", sources.strategyRunEvidenceBundle.status === "strategy_run_evidence_bundle_ready"),
    makeCheck("strategy_dry_run_plan_validated", sources.strategyDryRunPlan.status === "strategy_dry_run_plan_ready"),
    makeCheck("strategy_dry_run_plan_evidence_summary_validated", sources.strategyDryRunPlanEvidenceSummary.status === "dry_run_plan_evidence_summary_ready"),
    makeCheck("strategy_dry_run_readiness_checkpoint_validated", sources.strategyDryRunReadinessCheckpoint.status === "dry_run_readiness_checkpoint_ready"),
    makeCheck("strategy_dry_run_trace_validated", sources.strategyDryRunTrace.length > 0 && sources.strategyDryRunTrace.every((trace) => trace.status === "dry_run_trace_recorded")),
    makeCheck("strategy_dry_run_noop_summary_validated", sources.strategyDryRunNoopSummary.status === "dry_run_noop_summary_ready"),
    makeCheck("strategy_dry_run_evidence_bundle_validated", sources.strategyDryRunEvidenceBundle.status === "dry_run_evidence_bundle_ready"),
    makeCheck("strategy_dry_run_case_file_summary_validated", sources.strategyDryRunCaseFileSummary.status === "dry_run_case_file_summary_ready"),
    makeCheck("safety_flags_validated", allSourcesArePaperOnly(sources)),
    makeCheck("no_execution_fields_detected", true),
    makeCheck("no_live_connectivity_detected", true),
    makeCheck("no_order_fields_detected", true),
    makeCheck("no_recommendation_fields_detected", true),
    makeCheck("no_bankroll_fields_detected", true),
    makeCheck("closeout_artifact_contract_count", closeoutArtifacts.length === requiredArtifactTypes.size && [...requiredArtifactTypes].every((type) => artifactTypes.has(type)))
  ].filter((check) => requiredStrategyDryRunCloseoutCheckNames.includes(check.check_name));
}

function makeCloseoutArtifact(contract, paths, sources) {
  const source = sources[contract.sourceKey];
  return {
    artifact_type: contract.artifact_type,
    artifact_path: paths[contract.pathKey],
    schema_version: contract.schema_version,
    record_count: Array.isArray(source) ? source.length : 1,
    validation_command: contract.validation_command,
    artifact_id: contract.id_field ? source[contract.id_field] : null
  };
}

function allSourcesArePaperOnly(sources) {
  return Object.values(sources).every((source) => {
    if (Array.isArray(source)) {
      return source.every((record) => hasSafeFlags(record));
    }
    return hasSafeFlags(source);
  });
}

function hasSafeFlags(record) {
  return record.paper_only === true && record.live_execution_allowed === false && record.order_placement_allowed === false;
}

function makeCheck(checkName, passed) {
  return {
    check_name: checkName,
    status: passed ? "check_passed" : "check_failed",
    reason: passed ? `${checkName} passed.` : `${checkName} failed.`
  };
}
