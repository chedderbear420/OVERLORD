import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { formatRiskDecisionValidationReport, validateRiskDecisionFile, validateRiskDecisionRecords } from "../src/validate-risk-decisions.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const riskDecisionPath = path.join(repoRoot, "packages", "risk-governor", "fixtures", "synthetic_risk_decisions.jsonl");

test("synthetic risk decisions validate", async () => {
  const report = await validateRiskDecisionFile({ filePath: riskDecisionPath });

  assert.equal(report.ok, true);
  assert.equal(report.records, 3);
  assert.deepEqual(report.errors, []);
  assert.match(formatRiskDecisionValidationReport(report), /status: PASS/);
});

test("risk decision validator rejects bad deterministic id", () => {
  const report = validateRiskDecisionRecords([{
    lineNumber: 1,
    value: {
      risk_decision_id: "risk_wrong",
      schema_version: "risk_decision.v1",
      source_signal_id: "sig_a",
      source_state_id: "ms_a",
      source_event_id: "evt_a",
      source_payload_hash: "sha256:804456e1f1091972947b78d5768610ead24855b2dce0348f2cb4f9c1db124b3d",
      market_id: "M",
      captured_at: "2026-04-28T14:00:00Z",
      received_at: "2026-04-28T14:00:01Z",
      side: "YES",
      observed_price: 51,
      model_probability: 0.62,
      net_edge: 4.49,
      total_estimated_cost: 6.51,
      liquidity_status: "liquid",
      staleness_status: "fresh",
      quality_flags: [],
      risk_status: "risk_approved",
      risk_reasons: ["all_risk_checks_passed"],
      policy_id: "p",
      policy_version: "v1",
      max_paper_exposure_cents: 10000
    }
  }]);

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /risk_decision_id must be deterministic/);
});
