import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateStrategyRunManifest,
  validateStrategyRunManifestFile
} from "../src/validate-strategy-run-manifest.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_run_manifest.json");

test("synthetic StrategyRunManifest fixture validates", async () => {
  const report = await validateStrategyRunManifestFile({ filePath: fixturePath, repoRoot });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("StrategyRunManifest validator rejects unsafe flags, bad ids, and bad artifact counts", async () => {
  const manifest = await loadManifest();
  const report = await validateStrategyRunManifest({
    ...manifest,
    strategy_run_manifest_id: "bad",
    live_execution_allowed: true,
    artifacts: manifest.artifacts.map((artifact, index) => index === 2 ? { ...artifact, record_count: 19 } : artifact)
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /strategy_run_manifest_id must be deterministic/);
  assert.match(report.errors.join("\n"), /live_execution_allowed must be false/);
  assert.match(report.errors.join("\n"), /artifact record_count must match local fixture count/);
});

test("StrategyRunManifest validator rejects unsafe paths and forbidden fields", async () => {
  const manifest = await loadManifest();
  const report = await validateStrategyRunManifest({
    ...manifest,
    artifacts: manifest.artifacts.map((artifact, index) => index === 0 ? { ...artifact, artifact_path: "../secrets/live_config.json" } : artifact),
    order_request: { side: "YES" }
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /artifact_path artifact_path must not escape the repo/);
  assert.match(report.errors.join("\n"), /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/);
});

async function loadManifest() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
