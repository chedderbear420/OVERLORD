import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { buildReplayEvidenceBundle } from "../src/build-replay-evidence-bundle.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "replay-engine", "fixtures", "synthetic_replay_evidence_bundle.json");

test("buildReplayEvidenceBundle matches synthetic fixture", async () => {
  const generated = await buildReplayEvidenceBundle({ repoRoot, generatedAt: "2026-04-28T14:05:01Z" });
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

  assert.deepEqual(generated, fixture);
});

test("buildReplayEvidenceBundle preserves no-op replay provenance and checks", async () => {
  const bundle = await buildReplayEvidenceBundle({ repoRoot, generatedAt: "2026-04-28T14:05:01Z" });

  assert.equal(bundle.paper_only, true);
  assert.equal(bundle.live_execution_allowed, false);
  assert.equal(bundle.order_placement_allowed, false);
  assert.equal(bundle.evidence_artifacts.length, 5);
  assert.equal(bundle.noop_run_totals.total_trace_records, 20);
  assert.equal(bundle.noop_run_totals.total_records_read, 18);
  assert.equal(bundle.noop_run_totals.total_artifacts_read, 8);
  assert.equal(bundle.consistency_checks.every((check) => check.status === "check_passed"), true);
});
