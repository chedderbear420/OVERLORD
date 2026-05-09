import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateStrategyObservationTraceFile,
  validateStrategyObservationTraces
} from "../src/validate-strategy-observation-trace.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_trace.jsonl");

test("synthetic StrategyObservationTrace fixture validates", async () => {
  const report = await validateStrategyObservationTraceFile({ filePath: fixturePath, repoRoot });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("StrategyObservationTrace validator rejects unsafe flags, bad ids, and non-contiguous indexes", async () => {
  const traces = await loadTraces();
  const report = await validateStrategyObservationTraces(traces.map((trace, index) => index === 1
    ? { ...trace, strategy_observation_trace_id: "bad", live_execution_allowed: true, trace_index: 99 }
    : trace), { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /strategy_observation_trace_id must be deterministic/);
  assert.match(report.errors.join("\n"), /live_execution_allowed must be false/);
  assert.match(report.errors.join("\n"), /trace_index must be deterministic and contiguous/);
});

test("StrategyObservationTrace validator rejects unsafe paths and forbidden fields", async () => {
  const traces = await loadTraces();
  const report = await validateStrategyObservationTraces(traces.map((trace, index) => index === 1
    ? { ...trace, observed_artifact_path: "../.env", signal_request: { status: "blocked" } }
    : trace), { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /observed_artifact_path/);
  assert.match(report.errors.join("\n"), /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/);
});

async function loadTraces() {
  return (await readFile(fixturePath, "utf8"))
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}
