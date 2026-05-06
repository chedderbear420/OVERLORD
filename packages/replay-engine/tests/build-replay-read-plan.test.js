import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { buildReplayReadPlan } from "../src/build-replay-read-plan.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "replay-engine", "fixtures", "synthetic_replay_read_plan.json");

test("buildReplayReadPlan matches synthetic fixture", async () => {
  const expected = JSON.parse(await readFile(fixturePath, "utf8"));
  const actual = await buildReplayReadPlan({ repoRoot });

  assert.deepEqual(actual, expected);
});

test("buildReplayReadPlan preserves manifest artifact order and counts only local fixtures", async () => {
  const readPlan = await buildReplayReadPlan({ repoRoot });

  assert.equal(readPlan.paper_only, true);
  assert.equal(readPlan.live_execution_allowed, false);
  assert.equal(readPlan.order_placement_allowed, false);
  assert.equal(readPlan.total_records_planned, 18);
  assert.deepEqual(readPlan.artifact_reads.map((read) => read.read_index), [...Array(8).keys()]);
  assert.equal(readPlan.artifact_reads[0].artifact_type, "event_store_market_events");
  assert.equal(readPlan.artifact_reads.at(-1).artifact_type, "paper_performance_summary");
});
