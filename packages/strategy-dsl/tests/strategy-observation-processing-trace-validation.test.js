import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateStrategyObservationProcessingTraceFile,
  validateStrategyObservationProcessingTraces
} from "../src/validate-strategy-observation-processing-trace.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_processing_trace.jsonl");

test("synthetic StrategyObservationProcessingTrace fixture validates", async () => {
  const report = await validateStrategyObservationProcessingTraceFile({ filePath: fixturePath, repoRoot });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
  assert.equal(report.recordCount, 9);
});

test("StrategyObservationProcessingTrace validator rejects unsafe flags", async () => {
  const traces = await loadTraces();
  const tampered = traces.map((t) => ({ ...t, paper_only: false, live_execution_allowed: true }));
  const result = await validateStrategyObservationProcessingTraces(tampered, { repoRoot });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /paper_only must be true/);
  assert.match(result.errors.join("\n"), /live_execution_allowed must be false/);
});

test("StrategyObservationProcessingTrace validator rejects bad lifecycle order", async () => {
  const traces = await loadTraces();
  const reversed = [...traces].reverse();
  const result = await validateStrategyObservationProcessingTraces(reversed, { repoRoot });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /must start with noop_processing_started/);
});

test("StrategyObservationProcessingTrace validator rejects non-deterministic id", async () => {
  const traces = await loadTraces();
  const tampered = traces.map((t, i) => i === 0 ? { ...t, strategy_observation_processing_trace_id: "sopt_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" } : t);
  const result = await validateStrategyObservationProcessingTraces(tampered, { repoRoot });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /strategy_observation_processing_trace_id must be deterministic/);
});

test("StrategyObservationProcessingTrace validator rejects forbidden fields", async () => {
  const traces = await loadTraces();
  const tampered = [{ ...traces[0], order: { qty: 1 } }, ...traces.slice(1)];
  const result = await validateStrategyObservationProcessingTraces(tampered, { repoRoot });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/);
});

async function loadTraces() {
  return (await readFile(fixturePath, "utf8"))
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}
