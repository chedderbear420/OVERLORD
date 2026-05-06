import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateReplayNoopRunSummary,
  validateReplayNoopRunSummaryFile
} from "../src/validate-replay-noop-run-summary.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "replay-engine", "fixtures", "synthetic_replay_noop_run_summary.json");

test("synthetic ReplayNoOpRunSummary fixture validates", async () => {
  const report = await validateReplayNoopRunSummaryFile({ filePath: fixturePath, repoRoot });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("ReplayNoOpRunSummary validator rejects unsafe flags, bad ids, and bad totals", async () => {
  const summary = await loadSummary();
  const report = validateReplayNoopRunSummary({
    ...summary,
    replay_noop_run_summary_id: "bad",
    order_placement_allowed: true,
    total_trace_records: summary.total_records_read
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /replay_noop_run_summary_id must be deterministic/);
  assert.match(report.errors.join("\n"), /order_placement_allowed must be false/);
  assert.match(report.errors.join("\n"), /total_trace_records must equal total_records_read plus/);
});

test("ReplayNoOpRunSummary validator rejects forbidden recommendation fields", async () => {
  const summary = await loadSummary();
  const report = validateReplayNoopRunSummary({
    ...summary,
    recommended_action: "trade_live"
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /forbidden execution, strategy, bankroll, model, or recommendation field/);
});

async function loadSummary() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
