import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { validateReplayRunManifest, validateReplayRunManifestFile } from "../src/validate-replay-run-manifest.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const manifestFixturePath = path.join(repoRoot, "packages", "replay-engine", "fixtures", "synthetic_replay_run_manifest.json");

test("synthetic ReplayRunManifest validates", async () => {
  const report = await validateReplayRunManifestFile({ filePath: manifestFixturePath, repoRoot });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("ReplayRunManifest validator rejects unsafe flags and bad id", async () => {
  const manifest = await loadManifest();
  const report = await validateReplayRunManifest({
    ...manifest,
    replay_run_manifest_id: "bad_id",
    live_execution_allowed: true
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /replay_run_manifest_id must be deterministic/);
  assert.match(report.errors.join("\n"), /live_execution_allowed must be false/);
});

test("ReplayRunManifest validator rejects escaping, secret, and missing artifact paths", async () => {
  const manifest = await loadManifest();
  const escaping = { ...manifest.artifacts[0], artifact_path: "../outside.jsonl" };
  const secret = { ...manifest.artifacts[1], artifact_path: ".env" };
  const missing = { ...manifest.artifacts[2], artifact_path: "packages/replay-engine/fixtures/missing.json" };
  const report = await validateReplayRunManifest({
    ...manifest,
    artifacts: [escaping, secret, missing]
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /must not escape the repo/);
  assert.match(report.errors.join("\n"), /must not reference credentials/);
  assert.match(report.errors.join("\n"), /does not exist locally/);
});

test("ReplayRunManifest validator rejects invalid mode, status, and commands", async () => {
  const manifest = await loadManifest();
  const report = await validateReplayRunManifest({
    ...manifest,
    replay_mode: "live_replay",
    status: "strategy_recommended",
    artifacts: [{ ...manifest.artifacts[0], validation_command: "curl https://example.com" }]
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /replay_mode is invalid/);
  assert.match(report.errors.join("\n"), /status is invalid/);
  assert.match(report.errors.join("\n"), /validation_command must be a local npm script/);
});

async function loadManifest() {
  return JSON.parse(await readFile(manifestFixturePath, "utf8"));
}
