import path from "node:path";
import { readFile } from "node:fs/promises";
import { readJsonl } from "../../event-store/src/jsonl.js";
import { replayRunManifestId } from "./replay-run-manifest-id.js";

export const defaultReplayArtifacts = [
  {
    artifact_type: "event_store_market_events",
    artifact_path: "packages/event-store/fixtures/synthetic_market_events.jsonl",
    schema_version: "event_envelope.v1",
    validation_command: "npm run validate:event-store"
  },
  {
    artifact_type: "market_state",
    artifact_path: "packages/market-state-engine/fixtures/synthetic_market_states.jsonl",
    schema_version: "market_state.v1",
    validation_command: "npm run validate:market-state"
  },
  {
    artifact_type: "edge_signal",
    artifact_path: "packages/edge-scanner/fixtures/synthetic_edge_signals.jsonl",
    schema_version: "edge_signal.v1",
    validation_command: "npm run validate:edge-signals"
  },
  {
    artifact_type: "risk_decision",
    artifact_path: "packages/risk-governor/fixtures/synthetic_risk_decisions.jsonl",
    schema_version: "risk_decision.v1",
    validation_command: "npm run validate:risk-decisions"
  },
  {
    artifact_type: "action_decision",
    artifact_path: "packages/risk-governor/fixtures/synthetic_action_decisions.jsonl",
    schema_version: "action_decision.v1",
    validation_command: "npm run validate:action-decisions"
  },
  {
    artifact_type: "paper_ledger",
    artifact_path: "packages/paper-trader/fixtures/synthetic_paper_ledger_entries.jsonl",
    schema_version: "paper_ledger_entry.v1",
    validation_command: "npm run validate:paper-ledger"
  },
  {
    artifact_type: "paper_exit",
    artifact_path: "packages/paper-trader/fixtures/synthetic_paper_exits.jsonl",
    schema_version: "paper_exit.v1",
    validation_command: "npm run validate:paper-exits"
  },
  {
    artifact_type: "paper_performance_summary",
    artifact_path: "packages/paper-trader/fixtures/synthetic_paper_performance_summary.json",
    schema_version: "paper_performance_summary.v1",
    validation_command: "npm run validate:paper-performance-summary"
  }
];

export async function buildReplayRunManifest(options = {}) {
  const repoRoot = options.repoRoot ?? path.resolve(import.meta.dirname, "..", "..", "..");
  const generatedAt = options.generatedAt ?? "2026-04-28T14:05:01Z";
  const artifacts = [];

  for (const artifact of options.artifacts ?? defaultReplayArtifacts) {
    artifacts.push({
      ...artifact,
      record_count: await countArtifactRecords(repoRoot, artifact.artifact_path)
    });
  }

  return {
    replay_run_manifest_id: replayRunManifestId(generatedAt, artifacts),
    schema_version: "replay_run_manifest.v1",
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    replay_mode: "offline_fixture_replay",
    artifacts,
    validation_commands: [...new Set(artifacts.map((artifact) => artifact.validation_command))],
    status: "manifest_ready",
    reason: "Read-only manifest of local validated fake-data artifacts for offline fixture replay."
  };
}

async function countArtifactRecords(repoRoot, artifactPath) {
  if (artifactPath.endsWith(".jsonl")) {
    return (await readJsonl(path.join(repoRoot, artifactPath))).length;
  }
  JSON.parse(await readFile(path.join(repoRoot, artifactPath), "utf8"));
  return 1;
}
