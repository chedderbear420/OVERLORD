import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { buildStrategyObservationEvidenceBundle } from "../src/build-strategy-observation-evidence-bundle.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_evidence_bundle.json");

test("buildStrategyObservationEvidenceBundle matches synthetic fixture", async () => {
  const bundle = await buildStrategyObservationEvidenceBundle({ repoRoot });
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

  assert.deepEqual(bundle, fixture);
});

test("buildStrategyObservationEvidenceBundle inventories observation evidence without execution", async () => {
  const bundle = await buildStrategyObservationEvidenceBundle({ repoRoot });

  assert.equal(bundle.evidence_artifacts.length, 4);
  assert.equal(bundle.evidence_artifacts.find((artifact) => artifact.artifact_type === "strategy_observation_trace").record_count, 7);
  assert.equal(bundle.consistency_checks.every((check) => check.status === "check_passed"), true);
  assert.equal(bundle.status, "observation_evidence_bundle_ready");
  assert.equal(bundle.live_execution_allowed, false);
  assert.equal(bundle.order_placement_allowed, false);
});
