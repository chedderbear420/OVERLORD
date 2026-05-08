import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateStrategyDryRunTraceFile,
  validateStrategyDryRunTraces
} from "../src/validate-strategy-dry-run-trace.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_dry_run_trace.jsonl");

test("synthetic StrategyDryRunTrace fixture validates", async () => {
  const report = await validateStrategyDryRunTraceFile({ filePath: fixturePath });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
  assert.equal(report.recordCount, 7);
});

test("StrategyDryRunTrace validator rejects unsafe flags, bad ids, and non-contiguous indexes", async () => {
  const traces = await loadTraces();
  const report = validateStrategyDryRunTraces(traces.map((trace, index) => index === 1
    ? {
        ...trace,
        strategy_dry_run_trace_id: "bad",
        trace_index: 5,
        live_execution_allowed: true
      }
    : trace));

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /strategy_dry_run_trace_id must be deterministic/);
  assert.match(report.errors.join("\n"), /trace_index must be deterministic and contiguous/);
  assert.match(report.errors.join("\n"), /live_execution_allowed must be false/);
});

test("StrategyDryRunTrace validator rejects forbidden steps and forbidden fields", async () => {
  const traces = await loadTraces();
  const report = validateStrategyDryRunTraces(traces.map((trace, index) => index === 1
    ? {
        ...trace,
        planned_observation_step: {
          ...trace.planned_observation_step,
          step_type: "execute_strategy"
        },
        order_request: { side: "YES" }
      }
    : trace));

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /planned_observation_step step_type is invalid|planned_observation_step step_type is forbidden/);
  assert.match(report.errors.join("\n"), /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/);
});

async function loadTraces() {
  return parseJsonl(await readFile(fixturePath, "utf8"));
}

function parseJsonl(content) {
  return content
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}
