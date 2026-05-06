import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { validateReplayTraceFile, validateReplayTraces } from "../src/validate-replay-trace.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "replay-engine", "fixtures", "synthetic_replay_trace.jsonl");

test("synthetic ReplayTrace fixture validates", async () => {
  const report = await validateReplayTraceFile({ filePath: fixturePath, repoRoot });

  assert.equal(report.ok, true);
  assert.equal(report.recordCount, 20);
  assert.deepEqual(report.errors, []);
});

test("ReplayTrace validator rejects unsafe flags, bad ids, and non-contiguous indexes", async () => {
  const traces = await loadTraces();
  const report = await validateReplayTraces([
    {
      ...traces[0],
      replay_trace_id: "bad",
      live_execution_allowed: true
    },
    {
      ...traces[1],
      trace_index: 0
    }
  ], { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /replay_trace_id must be deterministic/);
  assert.match(report.errors.join("\n"), /live_execution_allowed must be false/);
  assert.match(report.errors.join("\n"), /trace_index values must be unique/);
});

test("ReplayTrace validator rejects unsafe paths and forbidden execution fields", async () => {
  const traces = await loadTraces();
  const report = await validateReplayTraces([{
    ...traces[1],
    artifact_path: "secrets/kalshi_api_key.json",
    execution_plan: { execute: true }
  }], { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /artifact_path artifact_path must not reference credentials/);
  assert.match(report.errors.join("\n"), /forbidden execution, strategy, bankroll, model, or recommendation field/);
});

async function loadTraces() {
  return (await readFile(fixturePath, "utf8"))
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}
