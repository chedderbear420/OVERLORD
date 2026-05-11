import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { buildStrategyObservationProcessingNoopSummary } from "../src/build-strategy-observation-processing-noop-summary.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_processing_noop_summary.json");

test("buildStrategyObservationProcessingNoopSummary matches synthetic fixture", async () => {
  const summary = await buildStrategyObservationProcessingNoopSummary({ repoRoot });
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

  assert.deepEqual(summary, fixture);
});

test("buildStrategyObservationProcessingNoopSummary produces safe summary record", async () => {
  const summary = await buildStrategyObservationProcessingNoopSummary({ repoRoot });

  assert.equal(summary.paper_only, true);
  assert.equal(summary.live_execution_allowed, false);
  assert.equal(summary.order_placement_allowed, false);
  assert.equal(summary.replay_mode, "offline_fixture_replay");
  assert.equal(summary.status, "processing_noop_summary_ready");
  assert.equal(summary.strategy_observation_processing_noop_summary_id.startsWith("sopns_"), true);
  assert.equal(summary.total_trace_records, summary.total_inputs_observed + 2);
  assert.equal(summary.total_inputs_observed, 7);
  assert.equal(summary.total_trace_records, 9);
});
