import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { buildStrategyObservationCaseFileSummary } from "../src/build-strategy-observation-case-file-summary.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_observation_case_file_summary.json");

test("buildStrategyObservationCaseFileSummary matches synthetic fixture", async () => {
  const summary = await buildStrategyObservationCaseFileSummary({ repoRoot });
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

  assert.deepEqual(summary, fixture);
});

test("buildStrategyObservationCaseFileSummary summarizes observation evidence totals", async () => {
  const summary = await buildStrategyObservationCaseFileSummary({ repoRoot });

  assert.equal(summary.total_evidence_artifacts, 4);
  assert.equal(summary.total_trace_records, 7);
  assert.equal(summary.total_inputs_observed, 5);
  assert.equal(summary.consistency_status, "consistency_passed");
  assert.equal(summary.status, "observation_case_file_summary_ready");
  assert.equal(summary.live_execution_allowed, false);
  assert.equal(summary.order_placement_allowed, false);
});
