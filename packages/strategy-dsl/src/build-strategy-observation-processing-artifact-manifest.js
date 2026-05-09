import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { validateSafeStrategyDslArtifactPath } from "./strategy-observation-boundary-guard.js";
import { buildStrategyObservationProcessingContract } from "./build-strategy-observation-processing-contract.js";
import { buildStrategyObservationProcessingInputSet } from "./build-strategy-observation-processing-input-set.js";
import { strategyObservationProcessingArtifactManifestId } from "./strategy-observation-processing-artifact-manifest-id.js";

export async function buildStrategyObservationProcessingArtifactManifest(options = {}) {
  const repoRoot = options.repoRoot ?? path.resolve(import.meta.dirname, "..", "..", "..");
  const createdAt = options.createdAt ?? "2026-04-28T14:05:06Z";
  const contract = options.contract ?? await buildStrategyObservationProcessingContract({ repoRoot, generatedAt: createdAt });
  const inputSet = options.inputSet ?? await buildStrategyObservationProcessingInputSet({ repoRoot, generatedAt: createdAt, contract });
  const artifactHashes = await hashInputArtifacts(repoRoot, inputSet.input_artifacts);

  return {
    artifact_manifest_id: strategyObservationProcessingArtifactManifestId({
      strategyObservationProcessingContractId: contract.strategy_observation_processing_contract_id,
      strategyObservationProcessingInputSetId: inputSet.strategy_observation_processing_input_set_id,
      artifactCount: inputSet.input_artifacts.length,
      hashCount: artifactHashes.length
    }),
    schema_version: "strategy_observation_processing_artifact_manifest.v1",
    created_at: createdAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    strategy_observation_processing_contract_id: contract.strategy_observation_processing_contract_id,
    strategy_observation_processing_input_set_id: inputSet.strategy_observation_processing_input_set_id,
    input_artifacts: inputSet.input_artifacts,
    artifact_hashes: artifactHashes,
    source_provenance: {
      source_strategy_observation_stack_closeout_checkpoint_id: inputSet.source_strategy_observation_stack_closeout_checkpoint_id,
      source_strategy_observation_case_file_summary_id: inputSet.source_strategy_observation_case_file_summary_id,
      source_strategy_observation_evidence_bundle_id: inputSet.source_strategy_observation_evidence_bundle_id,
      source_strategy_observation_noop_summary_id: inputSet.source_strategy_observation_noop_summary_id,
      source_strategy_definition_id: inputSet.source_strategy_definition_id,
      source_strategy_run_intent_id: inputSet.source_strategy_run_intent_id
    },
    validation_status: "validation_passed",
    status: "artifact_manifest_ready",
    reason_code: "VALIDATION_PASSED",
    reason: "metadata snapshot ready"
  };
}

export async function hashInputArtifacts(repoRoot, inputArtifacts) {
  const hashes = [];
  for (const artifact of inputArtifacts) {
    const errors = [];
    const resolved = await validateSafeStrategyDslArtifactPath(errors, repoRoot, artifact.artifact_path, "artifact_path");
    if (errors.length > 0) {
      throw new Error(errors.map((error) => error.message).join("; "));
    }
    const content = await readFile(resolved);
    hashes.push({
      artifact_type: artifact.artifact_type,
      artifact_path: artifact.artifact_path,
      sha256: `sha256:${createHash("sha256").update(content).digest("hex")}`
    });
  }
  return hashes;
}
