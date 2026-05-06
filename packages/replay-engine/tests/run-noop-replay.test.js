import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { runNoopReplay } from "../src/run-noop-replay.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const traceFixturePath = path.join(repoRoot, "packages", "replay-engine", "fixtures", "synthetic_replay_trace.jsonl");
const summaryFixturePath = path.join(repoRoot, "packages", "replay-engine", "fixtures", "synthetic_replay_noop_run_summary.json");
const clockFixturePath = path.join(repoRoot, "packages", "replay-engine", "fixtures", "synthetic_replay_clock.json");

test("runNoopReplay matches synthetic trace and summary fixtures", async () => {
  const expectedTraces = parseJsonl(await readFile(traceFixturePath, "utf8"));
  const expectedSummary = JSON.parse(await readFile(summaryFixturePath, "utf8"));
  const actual = await runNoopReplay({ repoRoot });

  assert.deepEqual(actual.traces, expectedTraces);
  assert.deepEqual(actual.summary, expectedSummary);
});

test("runNoopReplay only emits start, read, and completed no-op trace records", async () => {
  const result = await runNoopReplay({ repoRoot });

  assert.equal(result.traces.length, 20);
  assert.equal(result.traces[0].trace_event_type, "noop_replay_started");
  assert.equal(result.traces.at(-1).trace_event_type, "noop_replay_completed");
  assert.equal(result.traces.filter((trace) => trace.trace_event_type === "noop_record_read").length, 18);
  assert.equal(result.summary.total_records_read, 18);
  assert.equal(result.summary.total_trace_records, 20);
  assert.equal(result.summary.total_artifacts_read, 8);
  assert.equal(result.summary.live_execution_allowed, false);
  assert.equal(result.summary.order_placement_allowed, false);
});

test("runNoopReplay rejects clock events that are not present in local fixture records", async () => {
  const clock = JSON.parse(await readFile(clockFixturePath, "utf8"));
  clock.clock_events[0] = {
    ...clock.clock_events[0],
    record_ref: "packages/event-store/fixtures/synthetic_market_events.jsonl#L999"
  };

  await assert.rejects(
    () => runNoopReplay({ repoRoot, clock }),
    /Clock event record_ref is not present/
  );
});

function parseJsonl(content) {
  return content
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}
