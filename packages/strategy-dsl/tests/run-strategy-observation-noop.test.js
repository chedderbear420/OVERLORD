import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { runStrategyObservationNoop } from "../src/run-strategy-observation-noop.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const traceFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_trace.jsonl");
const summaryFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_noop_summary.json");

test("runStrategyObservationNoop matches synthetic trace and summary fixtures", async () => {
  const result = await runStrategyObservationNoop({ repoRoot });
  const traceFixture = parseJsonl(await readFile(traceFixturePath, "utf8"));
  const summaryFixture = JSON.parse(await readFile(summaryFixturePath, "utf8"));

  assert.deepEqual(result.traces, traceFixture);
  assert.deepEqual(result.summary, summaryFixture);
});

test("runStrategyObservationNoop only emits read-only observation metadata", async () => {
  const result = await runStrategyObservationNoop({ repoRoot });

  assert.equal(result.traces.length, 7);
  assert.equal(result.traces[0].trace_event_type, "noop_observation_started");
  assert.equal(result.traces.at(-1).trace_event_type, "noop_observation_completed");
  assert.equal(result.traces.filter((trace) => trace.trace_event_type === "noop_observation_input_seen").length, 5);
  assert.equal(result.traces.every((trace) => trace.paper_only === true), true);
  assert.equal(result.traces.every((trace) => trace.live_execution_allowed === false), true);
  assert.equal(result.traces.every((trace) => trace.order_placement_allowed === false), true);
  assert.equal(result.summary.total_inputs_observed, 5);
  assert.equal(result.summary.status, "observation_noop_summary_ready");
});

test("runStrategyObservationNoop rejects non-ready contracts", async () => {
  const observationContract = JSON.parse(await readFile(path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_contract.json"), "utf8"));
  observationContract.status = "strategy_observation_contract_rejected";

  await assert.rejects(
    () => runStrategyObservationNoop({ repoRoot, observationContract }),
    /StrategyObservationContract is not ready|No-op strategy observation inputs are invalid/
  );
});

function parseJsonl(content) {
  return content
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}
