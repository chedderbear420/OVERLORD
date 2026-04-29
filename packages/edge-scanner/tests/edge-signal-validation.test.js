import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { formatEdgeSignalValidationReport, validateEdgeSignalFile, validateEdgeSignalRecords } from "../src/validate-edge-signals.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const edgeSignalPath = path.join(repoRoot, "packages", "edge-scanner", "fixtures", "synthetic_edge_signals.jsonl");

test("synthetic EdgeSignal fixture validates", async () => {
  const report = await validateEdgeSignalFile({ filePath: edgeSignalPath });

  assert.equal(report.ok, true);
  assert.equal(report.records, 3);
  assert.deepEqual(report.errors, []);
  assert.match(formatEdgeSignalValidationReport(report), /status: PASS/);
});

test("validator rejects bad probability and net edge math", () => {
  const bad = {
    lineNumber: 1,
    value: {
      signal_id: "sig_ms_evt_synth_000002_YES_synth_model_bad",
      schema_version: "edge_signal.v1",
      source_state_id: "ms_evt_synth_000002",
      source_event_id: "evt_synth_000002",
      source_payload_hash: "sha256:804456e1f1091972947b78d5768610ead24855b2dce0348f2cb4f9c1db124b3d",
      market_id: "SYNTH-NBA-EXAMPLE-001",
      captured_at: "2026-04-28T14:00:02Z",
      received_at: "2026-04-28T14:00:03Z",
      side: "YES",
      observed_price: 51,
      model_id: "synth_model_bad",
      model_version: "v0.fixture",
      model_probability: 1.1,
      raw_edge: 11,
      estimated_fee_cost: 0.51,
      estimated_spread_cost: 2,
      estimated_slippage_cost: 1,
      uncertainty_penalty: 3,
      net_edge: 999,
      liquidity_status: "liquid",
      staleness_status: "fresh",
      quality_flags: [],
      edge_status: "positive",
      risk_status: "not_evaluated",
      action_eligibility: "candidate_only",
      reason: "bad fixture"
    }
  };

  const report = validateEdgeSignalRecords([bad]);
  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /model_probability must be between 0 and 1/);
});
