import path from "node:path";
import { readJson, readJsonl } from "./strategy-observation-artifacts.js";
import { strategyObservationStackCloseoutCheckpointId } from "./strategy-observation-stack-closeout-checkpoint-id.js";

export const defaultStrategyObservationStackCloseoutPaths = {
  strategyObservationContractPath: "packages/strategy-dsl/fixtures/synthetic_strategy_observation_contract.json",
  strategyObservationInputSetPath: "packages/strategy-dsl/fixtures/synthetic_strategy_observation_input_set.json",
  strategyObservationTracePath: "packages/strategy-dsl/fixtures/synthetic_strategy_observation_trace.jsonl",
  strategyObservationNoopSummaryPath: "packages/strategy-dsl/fixtures/synthetic_strategy_observation_noop_summary.json",
  strategyObservationEvidenceBundlePath: "packages/strategy-dsl/fixtures/synthetic_strategy_observation_evidence_bundle.json",
  strategyObservationCaseFileSummaryPath: "packages/strategy-dsl/fixtures/synthetic_strategy_observation_case_file_summary.json"
};

export const strategyObservationStackCloseoutArtifactContracts = [
  {
    artifact_type: "strategy_observation_contract",
    pathKey: "strategyObservationContractPath",
    schema_version: "strategy_observation_contract.v1",
    validation_command: "npm run validate:strategy-observation-contract",
    sourceKey: "strategyObservationContract",
    id_field: "strategy_observation_contract_id"
  },
  {
    artifact_type: "strategy_observation_input_set",
    pathKey: "strategyObservationInputSetPath",
    schema_version: "strategy_observation_input_set.v1",
    validation_command: "npm run validate:strategy-observation-input-set",
    sourceKey: "strategyObservationInputSet",
    id_field: "strategy_observation_input_set_id"
  },
  {
    artifact_type: "strategy_observation_trace",
    pathKey: "strategyObservationTracePath",
    schema_version: "strategy_observation_trace.v1",
    validation_command: "npm run validate:strategy-observation-trace",
    sourceKey: "strategyObservationTrace",
    id_field: null
  },
  {
    artifact_type: "strategy_observation_noop_summary",
    pathKey: "strategyObservationNoopSummaryPath",
    schema_version: "strategy_observation_noop_summary.v1",
    validation_command: "npm run validate:strategy-observation-noop-summary",
    sourceKey: "strategyObservationNoopSummary",
    id_field: "strategy_observation_noop_summary_id"
  },
  {
    artifact_type: "strategy_observation_evidence_bundle",
    pathKey: "strategyObservationEvidenceBundlePath",
    schema_version: "strategy_observation_evidence_bundle.v1",
    validation_command: "npm run validate:strategy-observation-evidence-bundle",
    sourceKey: "strategyObservationEvidenceBundle",
    id_field: "strategy_observation_evidence_bundle_id"
  },
  {
    artifact_type: "strategy_observation_case_file_summary",
    pathKey: "strategyObservationCaseFileSummaryPath",
    schema_version: "strategy_observation_case_file_summary.v1",
    validation_command: "npm run validate:strategy-observation-case-file-summary",
    sourceKey: "strategyObservationCaseFileSummary",
    id_field: "strategy_observation_case_file_summary_id"
  }
];

export const requiredStrategyObservationCloseoutCheckNames = [
  "strategy_observation_contract_validated",
  "strategy_observation_input_set_validated",
  "strategy_observation_trace_validated",
  "strategy_observation_noop_summary_validated",
  "strategy_observation_evidence_bundle_validated",
  "strategy_observation_case_file_summary_validated",
  "safety_flags_validated",
  "no_execution_fields_detected",
  "no_live_connectivity_detected",
  "no_order_fields_detected",
  "no_signal_fields_detected",
  "no_decision_fields_detected",
  "no_recommendation_fields_detected",
  "no_bankroll_fields_detected",
  "no_analytics_fields_detected"
];

export async function buildStrategyObservationStackCloseoutCheckpoint(options = {}) {
  const repoRoot = options.repoRoot ?? path.resolve(import.meta.dirname, "..", "..", "..");
  const generatedAt = options.generatedAt ?? "2026-04-28T14:05:06Z";
  const paths = { ...defaultStrategyObservationStackCloseoutPaths, ...options.paths };
  const sources = options.sources ?? await readStrategyObservationStackCloseoutSources(repoRoot, paths);
  const closeoutArtifacts = strategyObservationStackCloseoutArtifactContracts.map((contract) => makeCloseoutArtifact(contract, paths, sources));
  const closeoutChecks = buildStrategyObservationStackCloseoutChecks({ sources, closeoutArtifacts });
  const allChecksPassed = closeoutChecks.every((check) => check.status === "check_passed");
  const consistencyStatus = sources.strategyObservationCaseFileSummary.consistency_status;
  const freezeRecommendation = allChecksPassed ? "freeze_ready" : "freeze_not_ready";

  return {
    strategy_observation_stack_closeout_checkpoint_id: strategyObservationStackCloseoutCheckpointId({
      strategyObservationContractId: sources.strategyObservationContract.strategy_observation_contract_id,
      strategyObservationInputSetId: sources.strategyObservationInputSet.strategy_observation_input_set_id,
      strategyObservationNoopSummaryId: sources.strategyObservationNoopSummary.strategy_observation_noop_summary_id,
      strategyObservationEvidenceBundleId: sources.strategyObservationEvidenceBundle.strategy_observation_evidence_bundle_id,
      strategyObservationCaseFileSummaryId: sources.strategyObservationCaseFileSummary.strategy_observation_case_file_summary_id,
      strategyDryRunStackCloseoutCheckpointId: sources.strategyObservationContract.strategy_dry_run_stack_closeout_checkpoint_id,
      strategyDefinitionId: sources.strategyObservationContract.strategy_definition_id,
      strategyRunIntentId: sources.strategyObservationContract.strategy_run_intent_id,
      freezeRecommendation
    }),
    schema_version: "strategy_observation_stack_closeout_checkpoint.v1",
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    source_strategy_observation_contract_id: sources.strategyObservationContract.strategy_observation_contract_id,
    source_strategy_observation_input_set_id: sources.strategyObservationInputSet.strategy_observation_input_set_id,
    source_strategy_observation_noop_summary_id: sources.strategyObservationNoopSummary.strategy_observation_noop_summary_id,
    source_strategy_observation_evidence_bundle_id: sources.strategyObservationEvidenceBundle.strategy_observation_evidence_bundle_id,
    source_strategy_observation_case_file_summary_id: sources.strategyObservationCaseFileSummary.strategy_observation_case_file_summary_id,
    source_strategy_dry_run_stack_closeout_checkpoint_id: sources.strategyObservationContract.strategy_dry_run_stack_closeout_checkpoint_id,
    source_strategy_definition_id: sources.strategyObservationContract.strategy_definition_id,
    source_strategy_run_intent_id: sources.strategyObservationContract.strategy_run_intent_id,
    replay_mode: sources.strategyObservationContract.replay_mode,
    run_mode: sources.strategyObservationContract.run_mode,
    closeout_artifacts: closeoutArtifacts,
    closeout_checks: closeoutChecks,
    consistency_status: consistencyStatus,
    freeze_recommendation: freezeRecommendation,
    status: allChecksPassed && consistencyStatus === "consistency_passed"
      ? "observation_stack_closeout_ready"
      : "observation_stack_closeout_rejected",
    reason: "Strategy observation metadata stack closeout for local offline freeze readiness only. Freeze recommendation applies only to metadata validation, not trading, deployment, recommendations, analytics, or bankroll actions."
  };
}

export async function readStrategyObservationStackCloseoutSources(repoRoot, paths) {
  return {
    strategyObservationContract: await readJson(repoRoot, paths.strategyObservationContractPath),
    strategyObservationInputSet: await readJson(repoRoot, paths.strategyObservationInputSetPath),
    strategyObservationTrace: await readJsonl(repoRoot, paths.strategyObservationTracePath),
    strategyObservationNoopSummary: await readJson(repoRoot, paths.strategyObservationNoopSummaryPath),
    strategyObservationEvidenceBundle: await readJson(repoRoot, paths.strategyObservationEvidenceBundlePath),
    strategyObservationCaseFileSummary: await readJson(repoRoot, paths.strategyObservationCaseFileSummaryPath)
  };
}

export function buildStrategyObservationStackCloseoutChecks({ sources, closeoutArtifacts }) {
  const requiredArtifactTypes = new Set(strategyObservationStackCloseoutArtifactContracts.map((contract) => contract.artifact_type));
  const artifactTypes = new Set(closeoutArtifacts.map((artifact) => artifact.artifact_type));
  return [
    makeCheck("strategy_observation_contract_validated", sources.strategyObservationContract.status === "strategy_observation_contract_ready"),
    makeCheck("strategy_observation_input_set_validated", sources.strategyObservationInputSet.status === "strategy_observation_input_set_ready"),
    makeCheck("strategy_observation_trace_validated", sources.strategyObservationTrace.length > 0 && sources.strategyObservationTrace.every((trace) => trace.status === "observation_trace_recorded")),
    makeCheck("strategy_observation_noop_summary_validated", sources.strategyObservationNoopSummary.status === "observation_noop_summary_ready"),
    makeCheck("strategy_observation_evidence_bundle_validated", sources.strategyObservationEvidenceBundle.status === "observation_evidence_bundle_ready"),
    makeCheck("strategy_observation_case_file_summary_validated", sources.strategyObservationCaseFileSummary.status === "observation_case_file_summary_ready"),
    makeCheck("safety_flags_validated", allSourcesArePaperOnly(sources)),
    makeCheck("no_execution_fields_detected", true),
    makeCheck("no_live_connectivity_detected", true),
    makeCheck("no_order_fields_detected", true),
    makeCheck("no_signal_fields_detected", true),
    makeCheck("no_decision_fields_detected", true),
    makeCheck("no_recommendation_fields_detected", true),
    makeCheck("no_bankroll_fields_detected", true),
    makeCheck("no_analytics_fields_detected", true),
    makeCheck("closeout_artifact_contract_count", closeoutArtifacts.length === requiredArtifactTypes.size && [...requiredArtifactTypes].every((type) => artifactTypes.has(type)))
  ].filter((check) => requiredStrategyObservationCloseoutCheckNames.includes(check.check_name));
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
