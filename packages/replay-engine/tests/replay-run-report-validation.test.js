import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateReplayRunReport,
  validateReplayRunReportFile
} from "../src/validate-replay-run-report.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "replay-engine", "fixtures", "synthetic_replay_run_report.json");

test("synthetic ReplayRunReport fixture validates", async () => {
  const report = await validateReplayRunReportFile({ filePath: fixturePath, repoRoot });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("ReplayRunReport validator rejects unsafe flags, bad ids, and bad totals", async () => {
  const reportRecord = await loadReport();
  const report = validateReplayRunReport({
    ...reportRecord,
    replay_run_report_id: "bad",
    order_placement_allowed: true,
    total_trace_records: 19
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /replay_run_report_id must be deterministic/);
  assert.match(report.errors.join("\n"), /order_placement_allowed must be false/);
  assert.match(report.errors.join("\n"), /total_trace_records must equal total_records_read plus/);
});

test("ReplayRunReport validator rejects status mismatches and forbidden recommendation fields", async () => {
  const reportRecord = await loadReport();
  const report = validateReplayRunReport({
    ...reportRecord,
    status: "replay_run_report_rejected",
    recommended_action: "trade"
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /consistency_passed replay reports must use replay_run_report_ready status/);
  assert.match(report.errors.join("\n"), /forbidden execution, strategy, bankroll, model, or recommendation field/);
});

async function loadReport() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
