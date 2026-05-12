/**
 * kalshi-research-review-evidence-bundle-validation.test.js
 *
 * Phase 5B — Validation tests for KalshiResearchReviewEvidenceBundle.
 * 37 tests.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { validateKalshiResearchReviewEvidenceBundle } from "../src/validate-kalshi-research-review-evidence-bundle.js";

const FIXTURE_PATH =
  "packages/strategy-dsl/fixtures/synthetic_kalshi_research_review_evidence_bundle.json";

const fixture = JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ---------------------------------------------------------------------------
// Group 1: Valid fixture
// ---------------------------------------------------------------------------

test("valid fixture passes validation", () => {
  const { valid, errors } = validateKalshiResearchReviewEvidenceBundle(fixture);
  assert.equal(valid, true, `errors: ${errors.join(", ")}`);
  assert.equal(errors.length, 0);
});

// ---------------------------------------------------------------------------
// Group 2: Unknown fields
// ---------------------------------------------------------------------------

test("unknown top-level field fails", () => {
  const bad = { ...clone(fixture), unexpected_field: "x" };
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 3: Deterministic ID
// ---------------------------------------------------------------------------

test("non-deterministic ID fails", () => {
  const bad = clone(fixture);
  bad.kalshi_research_review_evidence_bundle_id = "krreb_" + "a".repeat(32);
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("wrong ID prefix fails", () => {
  const bad = clone(fixture);
  bad.kalshi_research_review_evidence_bundle_id = "wrong_2d4bb748dc0130b2d91397a06cacde74";
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 4: Confidence gate contract ID
// ---------------------------------------------------------------------------

test("wrong confidence_gate_contract_id fails", () => {
  const bad = clone(fixture);
  bad.confidence_gate_contract_id = "kcgc_" + "b".repeat(32);
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 5: input_artifact_refs
// ---------------------------------------------------------------------------

test("missing input_artifact_refs.market_snapshot fails", () => {
  const bad = clone(fixture);
  delete bad.input_artifact_refs.market_snapshot;
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("missing input_artifact_refs.paper_ledger_entry fails", () => {
  const bad = clone(fixture);
  delete bad.input_artifact_refs.paper_ledger_entry;
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("wrong artifact ref schema_version fails", () => {
  const bad = clone(fixture);
  bad.input_artifact_refs.market_snapshot.schema_version = "kalshi_market_snapshot.v99";
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("artifact ref required false fails", () => {
  const bad = clone(fixture);
  bad.input_artifact_refs.signal_evaluation_summary.required = false;
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("unknown artifact ref key fails", () => {
  const bad = clone(fixture);
  bad.input_artifact_refs.extra_artifact = { artifact_id: "x", schema_version: "x.v1", required: true };
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 6: evidence_items
// ---------------------------------------------------------------------------

test("empty evidence_items fails", () => {
  const bad = clone(fixture);
  bad.evidence_items = [];
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("duplicate evidence_id fails", () => {
  const bad = clone(fixture);
  bad.evidence_items = [...bad.evidence_items, clone(bad.evidence_items[0])];
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("unknown evidence_type fails", () => {
  const bad = clone(fixture);
  bad.evidence_items[0].evidence_type = "live_trade_fixture";
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("forbidden evidence_status 'passed' fails", () => {
  const bad = clone(fixture);
  bad.evidence_items[0].evidence_status = "passed";
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("forbidden evidence_status 'approved' fails", () => {
  const bad = clone(fixture);
  bad.evidence_items[0].evidence_status = "approved";
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("evidence item source_artifact_id mismatch fails", () => {
  const bad = clone(fixture);
  bad.evidence_items[0].source_artifact_id = "kms_" + "f".repeat(32);
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("evidence item source_schema_version mismatch fails", () => {
  const bad = clone(fixture);
  bad.evidence_items[0].source_schema_version = "kalshi_market_snapshot.v99";
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("evidence item unknown source_artifact_key fails", () => {
  const bad = clone(fixture);
  bad.evidence_items[0].source_artifact_key = "unknown_artifact";
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("evidence item unknown gate in supports_gate_ids fails", () => {
  const bad = clone(fixture);
  bad.evidence_items[0].supports_gate_ids = ["signal_calibration", "unknown_gate"];
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 7: gate_evidence_map
// ---------------------------------------------------------------------------

test("missing gate in gate_evidence_map fails", () => {
  const bad = clone(fixture);
  delete bad.gate_evidence_map.paper_pnl;
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("unknown gate key in gate_evidence_map fails", () => {
  const bad = clone(fixture);
  bad.gate_evidence_map.extra_gate = { mapped_evidence_ids: [], evidence_status: "mapped_not_evaluated" };
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("forbidden gate map status 'passed' fails", () => {
  const bad = clone(fixture);
  bad.gate_evidence_map.signal_calibration.evidence_status = "passed";
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("forbidden gate map status 'complete' fails", () => {
  const bad = clone(fixture);
  bad.gate_evidence_map.edge_consistency.evidence_status = "complete";
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("risk_governor non-empty mapped_evidence_ids fails", () => {
  const bad = clone(fixture);
  bad.gate_evidence_map.risk_governor.mapped_evidence_ids = ["ev_cgc_001"];
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("operator_signoff wrong evidence_status fails", () => {
  const bad = clone(fixture);
  bad.gate_evidence_map.operator_signoff.evidence_status = "mapped_not_evaluated";
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("gate map referencing non-existent evidence ID fails", () => {
  const bad = clone(fixture);
  bad.gate_evidence_map.paper_pnl.mapped_evidence_ids = ["ev_nonexistent_999"];
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 8: Safety flags
// ---------------------------------------------------------------------------

test("gate_evaluation_allowed true fails", () => {
  const bad = clone(fixture);
  bad.gate_evaluation_allowed = true;
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("gates_passed true fails", () => {
  const bad = clone(fixture);
  bad.gates_passed = true;
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("phase_6_ready true fails", () => {
  const bad = clone(fixture);
  bad.phase_6_ready = true;
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("live_mode_allowed true fails", () => {
  const bad = clone(fixture);
  bad.live_mode_allowed = true;
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("credentials_allowed true fails", () => {
  const bad = clone(fixture);
  bad.credentials_allowed = true;
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("order_placement_allowed true fails", () => {
  const bad = clone(fixture);
  bad.order_placement_allowed = true;
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("autonomous_execution_allowed true fails", () => {
  const bad = clone(fixture);
  bad.autonomous_execution_allowed = true;
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("operator_signoff_complete true fails", () => {
  const bad = clone(fixture);
  bad.operator_signoff_complete = true;
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("paper_only false fails", () => {
  const bad = clone(fixture);
  bad.paper_only = false;
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 9: Forbidden field names
// ---------------------------------------------------------------------------

test("forbidden field name 'api_key' at top level fails", () => {
  const bad = clone(fixture);
  bad.api_key = "should-not-exist";
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("forbidden field name 'approved_for_live' in nested object fails", () => {
  const bad = clone(fixture);
  bad.evidence_items[0].approved_for_live = true;
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 10: Forbidden string values
// ---------------------------------------------------------------------------

test("reason with 'approved for live' fails", () => {
  const bad = clone(fixture);
  bad.reason = "approved for live trading";
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("reason with 'place order' fails", () => {
  const bad = clone(fixture);
  bad.reason = "ready to place order";
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("evidence_items summary with 'passed gate' fails", () => {
  const bad = clone(fixture);
  bad.evidence_items[0].summary = "passed gate successfully";
  const { valid } = validateKalshiResearchReviewEvidenceBundle(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 11: Structural safety field name exemptions
// ---------------------------------------------------------------------------

test("structural safety flag field names pass (no false positive on field names)", () => {
  const result = validateKalshiResearchReviewEvidenceBundle(fixture);
  assert.equal(result.valid, true, `unexpected errors: ${result.errors.join(", ")}`);
  // Spot-check exempt fields are present
  assert.ok("order_placement_allowed" in fixture);
  assert.ok("credentials_allowed" in fixture);
  assert.ok("autonomous_execution_allowed" in fixture);
  assert.ok("operator_signoff_complete" in fixture);
  assert.ok("gate_evaluation_allowed" in fixture);
  assert.ok("gates_passed" in fixture);
});
