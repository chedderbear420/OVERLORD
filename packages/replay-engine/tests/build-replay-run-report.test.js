import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { buildReplayEvidenceBundle } from "../src/build-replay-evidence-bundle.js";
import { buildReplayRunReport } from "../src/build-replay-run-report.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "replay-engine", "fixtures", "synthetic_replay_run_report.json");

test("buildReplayRunReport matches synthetic fixture", async () => {
  const bundle = await buildReplayEvidenceBundle({ repoRoot, generatedAt: "2026-04-28T14:05:01Z" });
  const generated = await buildReplayRunReport({ repoRoot, generatedAt: "2026-04-28T14:05:01Z", bundle });
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

  assert.deepEqual(generated, fixture);
});

test("buildReplayRunReport is no-op metadata only", async () => {
  const report = await buildReplayRunReport({ repoRoot, generatedAt: "2026-04-28T14:05:01Z" });

  assert.equal(report.paper_only, true);
  assert.equal(report.live_execution_allowed, false);
  assert.equal(report.order_placement_allowed, false);
  assert.equal(report.total_artifacts_verified, 5);
  assert.equal(report.total_trace_records, 20);
  assert.equal(report.total_records_read, 18);
  assert.equal(report.total_artifacts_read, 8);
  assert.equal(report.consistency_status, "consistent");
});
