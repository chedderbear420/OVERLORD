/**
 * kalshi-paper-readiness-gate-evidence-bundle-validation.test.js
 *
 * Phase 5C — Validation tests for KalshiPaperReadinessGateEvidenceBundle.
 * 43 tests.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { validateKalshiPaperReadinessGateEvidenceBundle } from "../src/validate-kalshi-paper-readiness-gate-evidence-bundle.js";

const FIXTURE_PATH =
  "packages/strategy-dsl/fixtures/synthetic_kalshi_paper_readiness_gate_evidence_bundle.json";

const fixture = JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ---------------------------------------------------------------------------
// Group 1: Valid fixture
// ---------------------------------------------------------------------------

test("valid fixture passes validation", () => {
  const { valid, errors } = validateKalshiPaperReadinessGateEvidenceBundle(fixture);
  assert.equal(valid, true, `errors: ${errors.join(", ")}`);
  assert.equal(errors.length, 0);
});

// ---------------------------------------------------------------------------
// Group 2: Unknown fields
// ---------------------------------------------------------------------------

test("unknown top-level field fails", () => {
  const bad = { ...clone(fixture), unexpected_field: "x" };
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 3: Deterministic ID
// ---------------------------------------------------------------------------

test("non-deterministic ID fails", () => {
  const bad = clone(fixture);
  bad.kalshi_paper_readiness_gate_evidence_bundle_id = "kprgeb_" + "a".repeat(32);
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("wrong ID prefix fails", () => {
  const bad = clone(fixture);
  bad.kalshi_paper_readiness_gate_evidence_bundle_id = "wrong_94e7954d365d17782ed327761cf2e261";
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 4: upstream_evidence_bundle_ids
// ---------------------------------------------------------------------------

test("missing Phase 5A CGC ID in upstream_evidence_bundle_ids fails", () => {
  const bad = clone(fixture);
  bad.upstream_evidence_bundle_ids = ["krreb_2d4bb748dc0130b2d91397a06cacde74"];
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("missing Phase 5B KRREB ID in upstream_evidence_bundle_ids fails", () => {
  const bad = clone(fixture);
  bad.upstream_evidence_bundle_ids = ["kcgc_787dd9801f55fa3a73598d9f781a3f06"];
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 5: upstream_bundle_count
// ---------------------------------------------------------------------------

test("upstream_bundle_count mismatch fails", () => {
  const bad = clone(fixture);
  bad.upstream_bundle_count = 99;
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 6: upstream_bundle_schema_versions
// ---------------------------------------------------------------------------

test("wrong confidence_gate_contract schema version fails", () => {
  const bad = clone(fixture);
  bad.upstream_bundle_schema_versions.confidence_gate_contract = "kalshi_confidence_gate_contract.v99";
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("wrong research_review_evidence_bundle schema version fails", () => {
  const bad = clone(fixture);
  bad.upstream_bundle_schema_versions.research_review_evidence_bundle = "kalshi_research_review_evidence_bundle.v99";
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("unknown key in upstream_bundle_schema_versions fails", () => {
  const bad = clone(fixture);
  bad.upstream_bundle_schema_versions.extra = "extra.v1";
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("missing key in upstream_bundle_schema_versions fails", () => {
  const bad = clone(fixture);
  delete bad.upstream_bundle_schema_versions.confidence_gate_contract;
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 7: readiness_checks
// ---------------------------------------------------------------------------

test("missing readiness_checks key fails", () => {
  const bad = clone(fixture);
  delete bad.readiness_checks.paper_pnl_evidence_present;
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("unknown readiness_checks key fails", () => {
  const bad = clone(fixture);
  bad.readiness_checks.bonus_check = true;
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("edge_consistency_evidence_present true fails", () => {
  const bad = clone(fixture);
  bad.readiness_checks.edge_consistency_evidence_present = true;
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("replay_evidence_present true fails", () => {
  const bad = clone(fixture);
  bad.readiness_checks.replay_evidence_present = true;
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("non-boolean readiness_checks value fails", () => {
  const bad = clone(fixture);
  bad.readiness_checks.signal_calibration_evidence_present = "yes";
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 8: Safety flags
// ---------------------------------------------------------------------------

test("safety_flags.paper_only false fails", () => {
  const bad = clone(fixture);
  bad.safety_flags.paper_only = false;
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("safety_flags.live_execution_allowed true fails", () => {
  const bad = clone(fixture);
  bad.safety_flags.live_execution_allowed = true;
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("safety_flags.live_mode_allowed true fails", () => {
  const bad = clone(fixture);
  bad.safety_flags.live_mode_allowed = true;
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("safety_flags.order_placement_allowed true fails", () => {
  const bad = clone(fixture);
  bad.safety_flags.order_placement_allowed = true;
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("safety_flags.credentials_allowed true fails", () => {
  const bad = clone(fixture);
  bad.safety_flags.credentials_allowed = true;
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("safety_flags.credential_access_allowed true fails", () => {
  const bad = clone(fixture);
  bad.safety_flags.credential_access_allowed = true;
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("safety_flags.autonomous_execution_allowed true fails", () => {
  const bad = clone(fixture);
  bad.safety_flags.autonomous_execution_allowed = true;
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("safety_flags.gate_evaluation_allowed true fails", () => {
  const bad = clone(fixture);
  bad.safety_flags.gate_evaluation_allowed = true;
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("safety_flags.gates_passed true fails", () => {
  const bad = clone(fixture);
  bad.safety_flags.gates_passed = true;
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("safety_flags.phase_6_ready true fails", () => {
  const bad = clone(fixture);
  bad.safety_flags.phase_6_ready = true;
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("safety_flags.operator_signoff_complete true fails", () => {
  const bad = clone(fixture);
  bad.safety_flags.operator_signoff_complete = true;
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("unknown key in safety_flags fails", () => {
  const bad = clone(fixture);
  bad.safety_flags.extra_flag = false;
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("missing key in safety_flags fails", () => {
  const bad = clone(fixture);
  delete bad.safety_flags.paper_only;
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 9: Arrays must be non-empty
// ---------------------------------------------------------------------------

test("empty missing_evidence fails", () => {
  const bad = clone(fixture);
  bad.missing_evidence = [];
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("empty blocking_issues fails", () => {
  const bad = clone(fixture);
  bad.blocking_issues = [];
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("empty non_blocking_notes fails", () => {
  const bad = clone(fixture);
  bad.non_blocking_notes = [];
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("empty forbidden_capabilities fails", () => {
  const bad = clone(fixture);
  bad.forbidden_capabilities = [];
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("empty allowed_outputs fails", () => {
  const bad = clone(fixture);
  bad.allowed_outputs = [];
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("empty forbidden_outputs fails", () => {
  const bad = clone(fixture);
  bad.forbidden_outputs = [];
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 10: bundle_status allowlist
// ---------------------------------------------------------------------------

test("bundle_status 'ready' fails", () => {
  const bad = clone(fixture);
  bad.bundle_status = "ready";
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("bundle_status 'complete' fails", () => {
  const bad = clone(fixture);
  bad.bundle_status = "complete";
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 11: Forbidden field names
// ---------------------------------------------------------------------------

test("forbidden field name 'api_key' at top level fails", () => {
  const bad = clone(fixture);
  bad.api_key = "should-not-exist";
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("forbidden field name 'approved_for_live' in safety_flags fails", () => {
  const bad = clone(fixture);
  bad.safety_flags.approved_for_live = false;
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 12: Forbidden string values
// ---------------------------------------------------------------------------

test("reason with 'approved for live' fails", () => {
  const bad = clone(fixture);
  bad.reason = "approved for live trading";
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("reason with 'place order' fails", () => {
  const bad = clone(fixture);
  bad.reason = "ready to place order now";
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

test("reason with 'passed gate' fails", () => {
  const bad = clone(fixture);
  bad.reason = "passed gate successfully";
  const { valid } = validateKalshiPaperReadinessGateEvidenceBundle(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 13: Structural safety flag no false-positive on field names
// ---------------------------------------------------------------------------

test("structural safety flag field names pass (no false positive)", () => {
  const result = validateKalshiPaperReadinessGateEvidenceBundle(fixture);
  assert.equal(result.valid, true, `unexpected errors: ${result.errors.join(", ")}`);
  // Spot-check exempt fields are present in safety_flags
  assert.ok("order_placement_allowed" in fixture.safety_flags);
  assert.ok("credentials_allowed" in fixture.safety_flags);
  assert.ok("credential_access_allowed" in fixture.safety_flags);
  assert.ok("autonomous_execution_allowed" in fixture.safety_flags);
  assert.ok("operator_signoff_complete" in fixture.safety_flags);
  assert.ok("gate_evaluation_allowed" in fixture.safety_flags);
  assert.ok("gates_passed" in fixture.safety_flags);
  assert.ok("live_execution_allowed" in fixture.safety_flags);
  assert.ok("live_mode_allowed" in fixture.safety_flags);
  assert.ok("phase_6_ready" in fixture.safety_flags);
});
