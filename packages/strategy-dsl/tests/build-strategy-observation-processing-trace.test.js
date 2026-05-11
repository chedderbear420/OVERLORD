import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { buildStrategyObservationProcessingTraces } from "../src/build-strategy-observation-processing-trace.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_processing_trace.jsonl");

test("buildStrategyObservationProcessingTraces matches synthetic fixture", async () => {
  const traces = await buildStrategyObservationProcessingTraces({ repoRoot });
  const fixture = (await readFile(fixturePath, "utf8"))
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));

  assert.deepEqual(traces, fixture);
});

test("buildStrategyObservationProcessingTraces produces safe lifecycle records", async () => {
  const traces = await buildStrategyObservationProcessingTraces({ repoRoot });

  assert.equal(traces.length >= 3, true);
  assert.equal(traces[0].trace_event_type, "noop_processing_started");
  assert.equal(traces.at(-1).trace_event_type, "noop_processing_completed");
  assert.equal(traces.slice(1, -1).every((t) => t.trace_event_type === "noop_processing_input_seen"), true);
  assert.equal(traces.every((t) => t.paper_only === true), true);
  assert.equal(traces.every((t) => t.live_execution_allowed === false), true);
  assert.equal(traces.every((t) => t.order_placement_allowed === false), true);
  assert.equal(traces.every((t) => t.replay_mode === "offline_fixture_replay"), true);
  assert.equal(traces.every((t) => t.status === "processing_trace_recorded"), true);
  assert.equal(traces.every((t) => t.strategy_observation_processing_trace_id.startsWith("sopt_")), true);
});
