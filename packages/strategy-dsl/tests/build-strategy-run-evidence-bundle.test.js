import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { buildStrategyRunEvidenceBundle } from "../src/build-strategy-run-evidence-bundle.js";
import { buildStrategyRunManifest } from "../src/build-strategy-run-manifest.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_run_evidence_bundle.json");

test("buildStrategyRunEvidenceBundle matches synthetic fixture", async () => {
  const manifest = await buildStrategyRunManifest({ repoRoot });
  const bundle = await buildStrategyRunEvidenceBundle({ repoRoot, manifest });
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

  assert.deepEqual(bundle, fixture);
});

test("buildStrategyRunEvidenceBundle preserves no-op strategy provenance and checks", async () => {
  const manifest = await buildStrategyRunManifest({ repoRoot });
  const bundle = await buildStrategyRunEvidenceBundle({ repoRoot, manifest });

  assert.equal(bundle.strategy_run_manifest_id, manifest.strategy_run_manifest_id);
  assert.equal(bundle.strategy_noop_totals.total_trace_records, 20);
  assert.equal(bundle.strategy_noop_totals.total_inputs_observed, 18);
  assert.equal(bundle.consistency_checks.every((check) => check.status === "check_passed"), true);
  assert.equal(bundle.status, "strategy_run_evidence_bundle_ready");
});
