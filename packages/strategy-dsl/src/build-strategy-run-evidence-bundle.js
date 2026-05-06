import path from "node:path";
import {
  defaultStrategyArtifactPaths,
  readStrategyRunSources,
  strategyArtifactContracts
} from "./strategy-run-artifacts.js";
import { strategyRunEvidenceBundleId } from "./strategy-run-evidence-bundle-id.js";

export async function buildStrategyRunEvidenceBundle(options = {}) {
  const repoRoot = options.repoRoot ?? path.resolve(import.meta.dirname, "..", "..", "..");
  const generatedAt = options.generatedAt ?? "2026-04-28T14:05:01Z";
  const paths = { ...defaultStrategyArtifactPaths, ...options.paths };
  const sources = options.sources ?? await readStrategyRunSources(repoRoot, paths);
  const manifest = options.manifest;
  const evidenceArtifacts = strategyArtifactContracts.map((contract) => makeEvidenceArtifact(contract, paths, sources));
  const consistencyChecks = buildStrategyRunEvidenceConsistencyChecks({
    manifest,
    definition: sources.definition,
    intent: sources.intent,
    traces: sources.traces,
    summary: sources.summary,
    evidenceArtifacts
  });

  return {
    strategy_run_evidence_bundle_id: strategyRunEvidenceBundleId({
      strategyRunManifestId: manifest.strategy_run_manifest_id,
      strategyDefinitionId: sources.definition.strategy_definition_id,
      strategyRunIntentId: sources.intent.strategy_run_intent_id,
      traceCount: sources.traces.length,
      summaryId: sources.summary.strategy_noop_run_summary_id
    }),
    schema_version: "strategy_run_evidence_bundle.v1",
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    strategy_definition_id: sources.definition.strategy_definition_id,
    strategy_run_intent_id: sources.intent.strategy_run_intent_id,
    strategy_run_manifest_id: manifest.strategy_run_manifest_id,
    source_strategy_noop_run_summary_id: sources.summary.strategy_noop_run_summary_id,
    source_strategy_definition_path: paths.definitionPath,
    source_strategy_run_intent_path: paths.intentPath,
    source_strategy_run_trace_path: paths.tracePath,
    source_strategy_noop_run_summary_path: paths.summaryPath,
    replay_mode: sources.intent.replay_mode,
    run_mode: sources.intent.run_mode,
    evidence_artifacts: evidenceArtifacts,
    strategy_noop_totals: {
      total_trace_records: sources.summary.total_trace_records,
      total_inputs_observed: sources.summary.total_inputs_observed
    },
    consistency_checks: consistencyChecks,
    status: consistencyChecks.every((check) => check.status === "check_passed")
      ? "strategy_run_evidence_bundle_ready"
      : "strategy_run_evidence_bundle_rejected",
    reason: "Strategy run evidence bundle for local no-op strategy observation only. No strategy logic, signals, decisions, trades, or analytics produced."
  };
}

export function buildStrategyRunEvidenceConsistencyChecks({ manifest, definition, intent, traces, summary, evidenceArtifacts }) {
  return [
    makeCheck("strategy_definition_id_alignment", manifest.strategy_definition_id === definition.strategy_definition_id
      && intent.strategy_definition_id === definition.strategy_definition_id
      && traces.every((trace) => trace.strategy_definition_id === definition.strategy_definition_id)
      && summary.strategy_definition_id === definition.strategy_definition_id),
    makeCheck("strategy_run_intent_id_alignment", manifest.strategy_run_intent_id === intent.strategy_run_intent_id
      && traces.every((trace) => trace.strategy_run_intent_id === intent.strategy_run_intent_id)
      && summary.strategy_run_intent_id === intent.strategy_run_intent_id),
    makeCheck("trace_totals", traces.length === summary.total_trace_records),
    makeCheck("input_observation_totals", traces.filter((trace) => trace.trace_event_type === "noop_strategy_input_observed").length === summary.total_inputs_observed),
    makeCheck("evidence_artifact_contract_count", evidenceArtifacts.length === strategyArtifactContracts.length)
  ];
}

function makeEvidenceArtifact(contract, paths, sources) {
  const source = {
    strategy_definition: sources.definition,
    strategy_run_intent: sources.intent,
    strategy_noop_run_summary: sources.summary
  }[contract.artifact_type];
  return {
    artifact_type: contract.artifact_type,
    artifact_path: paths[contract.pathKey],
    schema_version: contract.schema_version,
    record_count: contract.artifact_type === "strategy_run_trace" ? sources.traces.length : 1,
    validation_command: contract.validation_command,
    artifact_id: contract.id_field ? source[contract.id_field] : null
  };
}

function makeCheck(checkName, passed) {
  return {
    check_name: checkName,
    status: passed ? "check_passed" : "check_failed",
    reason: passed ? `${checkName} passed.` : `${checkName} failed.`
  };
}
