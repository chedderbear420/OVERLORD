import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { runStrategyDryRunNoop } from "../src/run-strategy-dry-run-noop.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const traceFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_dry_run_trace.jsonl");
const summaryFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_dry_run_noop_summary.json");
const checkpointFixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_dry_run_readiness_checkpoint.json");

test("runStrategyDryRunNoop matches synthetic trace and summary fixtures", async () => {
  const result = await runStrategyDryRunNoop({ repoRoot });
  const expectedTraces = parseJsonl(await readFile(traceFixturePath, "utf8"));
  const expectedSummary = JSON.parse(await readFile(summaryFixturePath, "utf8"));

  assert.deepEqual(result.traces, expectedTraces);
  assert.deepEqual(result.summary, expectedSummary);
});

test("runStrategyDryRunNoop only emits readiness-backed no-op dry-run metadata", async () => {
  const result = await runStrategyDryRunNoop({ repoRoot });
  const eventTypes = result.traces.map((trace) => trace.trace_event_type);

  assert.equal(eventTypes[0], "noop_dry_run_started");
  assert.equal(eventTypes.at(-1), "noop_dry_run_completed");
  assert.equal(eventTypes.filter((eventType) => eventType === "noop_dry_run_step_observed").length, 5);
  assert.equal(result.summary.total_steps_observed, 5);
  assert.equal(result.summary.total_trace_records, 7);
  assert.equal(result.summary.readiness_status, "dry_run_ready");
  assert.equal(result.summary.live_execution_allowed, false);
  assert.equal(result.summary.order_placement_allowed, false);
});

test("runStrategyDryRunNoop rejects readiness checkpoints that are not ready", async () => {
  const readinessCheckpoint = JSON.parse(await readFile(checkpointFixturePath, "utf8"));

  await assert.rejects(
    runStrategyDryRunNoop({
      repoRoot,
      readinessCheckpoint: {
        ...readinessCheckpoint,
        readiness_status: "dry_run_not_ready",
        status: "dry_run_readiness_checkpoint_rejected"
      }
    }),
    /No-op strategy dry-run inputs are invalid|StrategyDryRunReadinessCheckpoint is not dry_run_ready/
  );
});

function parseJsonl(content) {
  return content
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}
