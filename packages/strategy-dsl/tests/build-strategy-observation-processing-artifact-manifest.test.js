import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { buildStrategyObservationProcessingArtifactManifest } from "../src/build-strategy-observation-processing-artifact-manifest.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_processing_artifact_manifest.json");

test("buildStrategyObservationProcessingArtifactManifest matches synthetic fixture", async () => {
  const manifest = await buildStrategyObservationProcessingArtifactManifest({ repoRoot });
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

  assert.deepEqual(manifest, fixture);
});

test("buildStrategyObservationProcessingArtifactManifest hashes every local input artifact", async () => {
  const manifest = await buildStrategyObservationProcessingArtifactManifest({ repoRoot });

  assert.equal(manifest.artifact_hashes.length, manifest.input_artifacts.length);
  assert.equal(manifest.artifact_hashes.every((hash) => /^sha256:[a-f0-9]{64}$/u.test(hash.sha256)), true);
  assert.equal(manifest.reason_code, "VALIDATION_PASSED");
});

test("buildStrategyObservationProcessingArtifactManifest seals Phase 4F/4G processing outputs", async () => {
  const manifest = await buildStrategyObservationProcessingArtifactManifest({ repoRoot });

  assert.equal(manifest.processing_output_artifacts.length, 2);
  assert.equal(manifest.output_artifact_hashes.length, 2);
  assert.equal(manifest.output_artifact_hashes.every((hash) => /^sha256:[a-f0-9]{64}$/u.test(hash.sha256)), true);
  assert.equal(manifest.processing_output_artifacts.some((a) => a.artifact_type === "strategy_observation_processing_trace"), true);
  assert.equal(manifest.processing_output_artifacts.some((a) => a.artifact_type === "strategy_observation_processing_noop_summary"), true);
  assert.equal(manifest.paper_only, true);
  assert.equal(manifest.live_execution_allowed, false);
  assert.equal(manifest.order_placement_allowed, false);
});
