import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { validateReplayReadPlan, validateReplayReadPlanFile } from "../src/validate-replay-read-plan.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "replay-engine", "fixtures", "synthetic_replay_read_plan.json");

test("synthetic ReplayReadPlan validates", async () => {
  const report = await validateReplayReadPlanFile({ filePath: fixturePath, repoRoot });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("ReplayReadPlan validator rejects bad id and unsafe flags", async () => {
  const readPlan = await loadReadPlan();
  const report = await validateReplayReadPlan({
    ...readPlan,
    replay_read_plan_id: "bad",
    order_placement_allowed: true
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /replay_read_plan_id must be deterministic/);
  assert.match(report.errors.join("\n"), /order_placement_allowed must be false/);
});

test("ReplayReadPlan validator rejects bad totals, duplicate reads, and unsafe paths", async () => {
  const readPlan = await loadReadPlan();
  const duplicateReads = [
    readPlan.artifact_reads[0],
    { ...readPlan.artifact_reads[0], read_index: 1 },
    ...readPlan.artifact_reads.slice(2)
  ];
  duplicateReads[2] = { ...duplicateReads[2], artifact_path: "secrets/kalshi_api_key.json" };
  const report = await validateReplayReadPlan({
    ...readPlan,
    total_records_planned: 999,
    artifact_reads: duplicateReads
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /total_records_planned must equal/);
  assert.match(report.errors.join("\n"), /duplicate artifact read is not allowed/);
  assert.match(report.errors.join("\n"), /artifact_path artifact_path must not reference credentials/);
});

test("ReplayReadPlan validator rejects invalid status and read_index gaps", async () => {
  const readPlan = await loadReadPlan();
  const report = await validateReplayReadPlan({
    ...readPlan,
    status: "replay_executed",
    artifact_reads: [{ ...readPlan.artifact_reads[0], read_index: 99 }]
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /status is invalid/);
  assert.match(report.errors.join("\n"), /read_index must be deterministic and contiguous/);
});

test("ReplayReadPlan validator rejects network-shaped validation commands", async () => {
  const readPlan = await loadReadPlan();
  const report = await validateReplayReadPlan({
    ...readPlan,
    artifact_reads: [{
      ...readPlan.artifact_reads[0],
      validation_command: "npm run validate:event-store && curl https://example.com"
    }]
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /artifact_read validation_command must be a local npm script/);
});

async function loadReadPlan() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
