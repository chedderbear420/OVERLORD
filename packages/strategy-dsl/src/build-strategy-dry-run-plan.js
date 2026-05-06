import path from "node:path";
import { readJson } from "./strategy-run-artifacts.js";
import { strategyDryRunPlanId } from "./strategy-dry-run-plan-id.js";

export const allowedDryRunInputArtifacts = [
  "strategy_definition",
  "strategy_run_intent",
  "strategy_run_trace",
  "strategy_noop_run_summary",
  "replay_trace",
  "replay_clock",
  "replay_read_plan",
  "market_state"
];

export const requiredDryRunForbiddenOutputs = [
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

export const allowedDryRunStepTypes = [
  "read_strategy_contract",
  "read_strategy_intent",
  "read_replay_trace",
  "observe_market_state_metadata",
  "emit_noop_observation_trace"
];

export const requiredDryRunSafetyConstraints = [
  "no_network",
  "no_credentials",
  "no_live_execution",
  "no_order_placement",
  "no_strategy_recommendations",
  "no_bankroll_management"
];

const defaultPaths = {
  definitionPath: "packages/strategy-dsl/fixtures/synthetic_strategy_definition.json",
  intentPath: "packages/strategy-dsl/fixtures/synthetic_strategy_run_intent.json",
  manifestPath: "packages/strategy-dsl/fixtures/synthetic_strategy_run_manifest.json",
  evidencePath: "packages/strategy-dsl/fixtures/synthetic_strategy_run_evidence_bundle.json"
};

export async function buildStrategyDryRunPlan(options = {}) {
  const repoRoot = options.repoRoot ?? path.resolve(import.meta.dirname, "..", "..", "..");
  const generatedAt = options.generatedAt ?? "2026-04-28T14:05:02Z";
  const paths = { ...defaultPaths, ...options.paths };
  const definition = options.definition ?? await readJson(repoRoot, paths.definitionPath);
  const intent = options.intent ?? await readJson(repoRoot, paths.intentPath);
  const manifest = options.manifest ?? await readJson(repoRoot, paths.manifestPath);
  const evidence = options.evidence ?? await readJson(repoRoot, paths.evidencePath);
  const allowedInputArtifacts = buildAllowedInputArtifacts();

  return {
    strategy_dry_run_plan_id: strategyDryRunPlanId({
      strategyDefinitionId: definition.strategy_definition_id,
      strategyRunIntentId: intent.strategy_run_intent_id,
      strategyRunManifestId: manifest.strategy_run_manifest_id,
      strategyRunEvidenceBundleId: evidence.strategy_run_evidence_bundle_id,
      generatedAt
    }),
    schema_version: "strategy_dry_run_plan.v1",
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    strategy_definition_id: definition.strategy_definition_id,
    strategy_run_intent_id: intent.strategy_run_intent_id,
    strategy_run_manifest_id: manifest.strategy_run_manifest_id,
    strategy_run_evidence_bundle_id: evidence.strategy_run_evidence_bundle_id,
    source_strategy_definition_id: definition.strategy_definition_id,
    source_strategy_run_intent_id: intent.strategy_run_intent_id,
    source_strategy_run_manifest_id: manifest.strategy_run_manifest_id,
    source_strategy_run_evidence_bundle_id: evidence.strategy_run_evidence_bundle_id,
    replay_mode: intent.replay_mode,
    run_mode: "dry_run_planned",
    allowed_input_artifacts: allowedInputArtifacts,
    forbidden_outputs: [...requiredDryRunForbiddenOutputs],
    planned_observation_steps: buildPlannedObservationSteps(),
    safety_constraints: [...requiredDryRunSafetyConstraints],
    status: "strategy_dry_run_plan_ready",
    reason: "Offline dry-run plan contract only. It defines readable metadata and forbidden outputs without executing strategy logic."
  };
}

function buildAllowedInputArtifacts() {
  return [
    makeArtifact("strategy_definition", "packages/strategy-dsl/fixtures/synthetic_strategy_definition.json"),
    makeArtifact("strategy_run_intent", "packages/strategy-dsl/fixtures/synthetic_strategy_run_intent.json"),
    makeArtifact("strategy_run_trace", "packages/strategy-dsl/fixtures/synthetic_strategy_run_trace.jsonl"),
    makeArtifact("strategy_noop_run_summary", "packages/strategy-dsl/fixtures/synthetic_strategy_noop_run_summary.json"),
    makeArtifact("replay_trace", "packages/replay-engine/fixtures/synthetic_replay_trace.jsonl"),
    makeArtifact("replay_clock", "packages/replay-engine/fixtures/synthetic_replay_clock.json"),
    makeArtifact("replay_read_plan", "packages/replay-engine/fixtures/synthetic_replay_read_plan.json"),
    makeArtifact("market_state", "packages/market-state-engine/fixtures/synthetic_market_states.jsonl")
  ];
}

function makeArtifact(artifactType, artifactPath) {
  return {
    artifact_type: artifactType,
    artifact_path: artifactPath,
    access_mode: "read_only"
  };
}

function buildPlannedObservationSteps() {
  return [
    makeStep(0, "read_strategy_contract", ["strategy_definition"]),
    makeStep(1, "read_strategy_intent", ["strategy_run_intent"]),
    makeStep(2, "read_replay_trace", ["replay_trace", "replay_clock", "replay_read_plan"]),
    makeStep(3, "observe_market_state_metadata", ["market_state"]),
    makeStep(4, "emit_noop_observation_trace", ["strategy_run_trace", "strategy_noop_run_summary"])
  ];
}

function makeStep(stepIndex, stepType, reads) {
  return {
    step_index: stepIndex,
    step_type: stepType,
    reads,
    metadata_only: true
  };
}
