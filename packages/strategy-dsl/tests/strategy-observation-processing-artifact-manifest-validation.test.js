import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateStrategyObservationProcessingArtifactManifest,
  validateStrategyObservationProcessingArtifactManifestFile
} from "../src/validate-strategy-observation-processing-artifact-manifest.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_processing_artifact_manifest.json");

test("synthetic StrategyObservationProcessingArtifactManifest fixture validates", async () => {
  const report = await validateStrategyObservationProcessingArtifactManifestFile({ filePath: fixturePath, repoRoot });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("StrategyObservationProcessingArtifactManifest validator rejects hash and unknown-field tampering", async () => {
  const manifest = await loadManifest();
  const report = await validateStrategyObservationProcessingArtifactManifest({
    ...manifest,
    score: 1,
    artifact_hashes: [
      {
        ...manifest.artifact_hashes[0],
        sha256: "sha256:0000000000000000000000000000000000000000000000000000000000000000"
      },
      ...manifest.artifact_hashes.slice(1)
    ]
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.equal(report.errors.some((error) => error.reason_code === "ERR_UNKNOWN_FIELD"), true);
  assert.match(report.errors.map(String).join("\n"), /ERR_HASH_MISMATCH/);
});

async function loadManifest() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
