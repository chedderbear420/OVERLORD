import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateStrategyRunTraceFile,
  validateStrategyRunTraces
} from "../src/validate-strategy-run-trace.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_run_trace.jsonl");

test("synthetic StrategyRunTrace fixture validates", async () => {
  const report = await validateStrategyRunTraceFile({ filePath: fixturePath, repoRoot });

  assert.equal(report.ok, true);
  assert.equal(report.recordCount, 20);
  assert.deepEqual(report.errors, []);
});

test("StrategyRunTrace validator rejects bad ids, unsafe flags, and non-contiguous indexes", async () => {
  const traces = await loadTraces();
  const report = await validateStrategyRunTraces([
    { ...traces[0], strategy_run_trace_id: "bad", live_execution_allowed: true },
    { ...traces[1], trace_index: 3 }
  ], { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /strategy_run_trace_id must be deterministic/);
  assert.match(report.errors.join("\n"), /live_execution_allowed must be false/);
  assert.match(report.errors.join("\n"), /trace_index must be deterministic and contiguous/);
});

test("StrategyRunTrace validator rejects unsafe paths and forbidden runtime fields", async () => {
  const traces = await loadTraces();
  const report = await validateStrategyRunTraces([
    {
      ...traces[0],
      artifact_path: "../secrets/live_config.json",
      execution_plan: { execute: true }
    }
  ], { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /artifact_path artifact_path must not escape the repo/);
  assert.match(report.errors.join("\n"), /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/);
});

async function loadTraces() {
  return (await readFile(fixturePath, "utf8"))
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}
