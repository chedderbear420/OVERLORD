import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { buildReplayRunManifest } from "../src/build-replay-run-manifest.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const manifestFixturePath = path.join(repoRoot, "packages", "replay-engine", "fixtures", "synthetic_replay_run_manifest.json");

test("buildReplayRunManifest matches synthetic fixture", async () => {
  const generated = await buildReplayRunManifest({
    repoRoot,
    generatedAt: "2026-04-28T14:05:01Z"
  });
  const fixture = JSON.parse(await readFile(manifestFixturePath, "utf8"));

  assert.deepEqual(generated, fixture);
});

test("buildReplayRunManifest is read-only and deterministic", async () => {
  const first = await buildReplayRunManifest({ repoRoot, generatedAt: "2026-04-28T14:05:01Z" });
  const second = await buildReplayRunManifest({ repoRoot, generatedAt: "2026-04-28T14:05:01Z" });

  assert.deepEqual(first, second);
  assert.equal(first.paper_only, true);
  assert.equal(first.live_execution_allowed, false);
  assert.equal(first.order_placement_allowed, false);
  assert.equal(first.replay_mode, "offline_fixture_replay");
});
