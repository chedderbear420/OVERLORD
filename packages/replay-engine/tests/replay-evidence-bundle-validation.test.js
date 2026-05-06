import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateReplayEvidenceBundle,
  validateReplayEvidenceBundleFile
} from "../src/validate-replay-evidence-bundle.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "replay-engine", "fixtures", "synthetic_replay_evidence_bundle.json");

test("synthetic ReplayEvidenceBundle fixture validates", async () => {
  const report = await validateReplayEvidenceBundleFile({ filePath: fixturePath, repoRoot });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("ReplayEvidenceBundle validator rejects unsafe flags, bad ids, and bad totals", async () => {
  const bundle = await loadBundle();
  const report = await validateReplayEvidenceBundle({
    ...bundle,
    replay_evidence_bundle_id: "bad",
    live_execution_allowed: true,
    noop_run_totals: {
      ...bundle.noop_run_totals,
      total_trace_records: 19
    }
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /replay_evidence_bundle_id must be deterministic/);
  assert.match(report.errors.join("\n"), /live_execution_allowed must be false/);
  assert.match(report.errors.join("\n"), /noop_run_totals total_trace_records must match replay_trace record_count/);
});

test("ReplayEvidenceBundle validator rejects unsafe paths and failed ready checks", async () => {
  const bundle = await loadBundle();
  const report = await validateReplayEvidenceBundle({
    ...bundle,
    source_trace_path: "../secrets/live_config.json",
    consistency_checks: [
      {
        ...bundle.consistency_checks[0],
        status: "check_failed"
      }
    ],
    strategy_score: 1
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /source_trace_path artifact_path must not escape the repo/);
  assert.match(report.errors.join("\n"), /ready evidence bundles must not contain failed consistency checks/);
  assert.match(report.errors.join("\n"), /forbidden execution, strategy, bankroll, model, or recommendation field/);
});

async function loadBundle() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
