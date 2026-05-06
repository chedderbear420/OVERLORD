import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { runNoopStrategy } from "../src/run-noop-strategy.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const traceFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_run_trace.jsonl");
const summaryFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_noop_run_summary.json");

test("runNoopStrategy matches synthetic trace and summary fixtures", async () => {
  const result = await runNoopStrategy({ repoRoot });
  const expectedTraces = parseJsonl(await readFile(traceFixturePath, "utf8"));
  const expectedSummary = JSON.parse(await readFile(summaryFixturePath, "utf8"));

  assert.deepEqual(result.traces, expectedTraces);
  assert.deepEqual(result.summary, expectedSummary);
});

test("runNoopStrategy only emits no-op strategy observation records", async () => {
  const result = await runNoopStrategy({ repoRoot });
  const eventTypes = result.traces.map((trace) => trace.trace_event_type);

  assert.equal(eventTypes[0], "noop_strategy_run_started");
  assert.equal(eventTypes.at(-1), "noop_strategy_run_completed");
  assert.equal(eventTypes.filter((eventType) => eventType === "noop_strategy_input_observed").length, 18);
  assert.equal(result.summary.total_inputs_observed, 18);
  assert.equal(result.summary.total_trace_records, 20);
  assert.equal(result.summary.live_execution_allowed, false);
  assert.equal(result.summary.order_placement_allowed, false);
});

test("runNoopStrategy rejects mismatched StrategyRunIntent references", async () => {
  await assert.rejects(
    runNoopStrategy({
      repoRoot,
      strategyRunIntent: {
        ...JSON.parse(await readFile(path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_run_intent.json"), "utf8")),
        strategy_definition_id: "sdef_mismatch"
      }
    }),
    /No-op strategy inputs are invalid/
  );
});

function parseJsonl(content) {
  return content
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}
