import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { readJsonl } from "../../event-store/src/jsonl.js";
import {
  validateActionDecisionFile,
  validateRiskDecisionFile
} from "../src/validate-risk-decisions.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "risk-governor", "fixtures", "negative");
const riskDecisionPath = path.join(repoRoot, "packages", "risk-governor", "fixtures", "synthetic_risk_decisions.jsonl");
const actionDecisionPath = path.join(repoRoot, "packages", "risk-governor", "fixtures", "synthetic_action_decisions.jsonl");

const riskCases = [
  ["malformed_risk_decision_jsonl.jsonl", "Invalid JSONL at line 1"],
  ["missing_provenance.jsonl", "source_payload_hash is required"],
  ["bad_risk_decision_id.jsonl", "risk_decision_id must be deterministic"],
  ["invalid_risk_status.jsonl", "risk_status is invalid"],
  ["non_monotonic_decision_order.jsonl", "received_at must be monotonic for decision fixture order"]
];

const actionCases = [
  ["bad_action_decision_id.jsonl", "action_decision_id must be deterministic"],
  ["invalid_action_status.jsonl", "action_status is invalid"],
  ["forbidden_live_execution_allowed.jsonl", "live_execution_allowed must be false"],
  ["forbidden_order_placement_allowed.jsonl", "order_placement_allowed must be false"],
  ["non_paper_only_action.jsonl", "paper_only must be true"],
  ["invalid_exposure.jsonl", "max_paper_exposure_cents must be a non-negative integer"],
  ["inconsistent_approved_rejected_mapping.jsonl", "risk_rejected actions cannot be paper_candidate_allowed"]
];

test("positive ActionDecision fixture validates against RiskDecision mapping", async () => {
  const riskDecisionsById = await loadRiskDecisionMap();
  const report = await validateActionDecisionFile({
    filePath: actionDecisionPath,
    riskDecisionsById
  });

  assert.equal(report.ok, true);
  assert.equal(report.records, 3);
  assert.deepEqual(report.errors, []);
});

for (const [file, expected] of riskCases) {
  test(`${file} fails with expected RiskDecision validation message`, async () => {
    const report = await validateRiskDecisionFile({
      filePath: path.join(negativeDir, file)
    });

    assert.equal(report.ok, false);
    assert.match(report.errors.join("\n"), new RegExp(escapeRegExp(expected)));
  });
}

for (const [file, expected] of actionCases) {
  test(`${file} fails with expected ActionDecision validation message`, async () => {
    const report = await validateActionDecisionFile({
      filePath: path.join(negativeDir, file),
      riskDecisionsById: await loadRiskDecisionMap()
    });

    assert.equal(report.ok, false);
    assert.match(report.errors.join("\n"), new RegExp(escapeRegExp(expected)));
  });
}

async function loadRiskDecisionMap() {
  const records = await readJsonl(riskDecisionPath);
  return new Map(records.map((record) => [record.value.risk_decision_id, record.value]));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
