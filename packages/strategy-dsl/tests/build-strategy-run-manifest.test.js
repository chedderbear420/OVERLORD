import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { buildStrategyRunManifest } from "../src/build-strategy-run-manifest.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_run_manifest.json");

test("buildStrategyRunManifest matches synthetic fixture", async () => {
  const manifest = await buildStrategyRunManifest({ repoRoot });
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

  assert.deepEqual(manifest, fixture);
});

test("buildStrategyRunManifest inventories only local no-op strategy artifacts", async () => {
  const manifest = await buildStrategyRunManifest({ repoRoot });

  assert.deepEqual(manifest.artifacts.map((artifact) => artifact.artifact_type), [
    "strategy_definition",
    "strategy_run_intent",
    "strategy_run_trace",
    "strategy_noop_run_summary"
  ]);
  assert.deepEqual(manifest.artifacts.map((artifact) => artifact.record_count), [1, 1, 20, 1]);
  assert.equal(manifest.live_execution_allowed, false);
  assert.equal(manifest.order_placement_allowed, false);
});
