import path from "node:path";
import { countStrategyArtifactRecords, defaultStrategyArtifactPaths, readStrategyRunSources, strategyArtifactContracts } from "./strategy-run-artifacts.js";
import { strategyRunManifestId } from "./strategy-run-manifest-id.js";

export async function buildStrategyRunManifest(options = {}) {
  const repoRoot = options.repoRoot ?? path.resolve(import.meta.dirname, "..", "..", "..");
  const generatedAt = options.generatedAt ?? "2026-04-28T14:05:01Z";
  const paths = { ...defaultStrategyArtifactPaths, ...options.paths };
  const sources = options.sources ?? await readStrategyRunSources(repoRoot, paths);
  const artifacts = [];

  for (const contract of strategyArtifactContracts) {
    const artifactPath = paths[contract.pathKey];
    artifacts.push({
      artifact_type: contract.artifact_type,
      artifact_path: artifactPath,
      schema_version: contract.schema_version,
      record_count: await countStrategyArtifactRecords(repoRoot, artifactPath),
      validation_command: contract.validation_command
    });
  }

  return {
    strategy_run_manifest_id: strategyRunManifestId(generatedAt, artifacts),
    schema_version: "strategy_run_manifest.v1",
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    strategy_definition_id: sources.definition.strategy_definition_id,
    strategy_run_intent_id: sources.intent.strategy_run_intent_id,
    replay_mode: sources.intent.replay_mode,
    run_mode: sources.intent.run_mode,
    artifacts,
    validation_commands: [...new Set(artifacts.map((artifact) => artifact.validation_command))],
    status: "strategy_run_manifest_ready",
    reason: "Read-only manifest of local no-op strategy run artifacts. No strategy logic executed."
  };
}
