/**
 * kalshi-confidence-gate-contract-validation.test.js
 *
 * Phase 5A — Validation tests for KalshiConfidenceGateContract.
 * 29 tests.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { validateKalshiConfidenceGateContract } from "../src/validate-kalshi-confidence-gate-contract.js";

const FIXTURE_PATH =
  "packages/strategy-dsl/fixtures/synthetic_kalshi_confidence_gate_contract.json";

const fixture = JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ---------------------------------------------------------------------------
// Group 1: Valid fixture
// ---------------------------------------------------------------------------

test("valid fixture passes validation", () => {
  const { valid, errors } = validateKalshiConfidenceGateContract(fixture);
  assert.equal(valid, true, `errors: ${errors.join(", ")}`);
  assert.equal(errors.length, 0);
});

// ---------------------------------------------------------------------------
// Group 2: Unknown fields
// ---------------------------------------------------------------------------

test("unknown top-level field fails", () => {
  const bad = { ...clone(fixture), unexpected_field: "x" };
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 3: Deterministic ID
// ---------------------------------------------------------------------------

test("non-deterministic ID fails", () => {
  const bad = clone(fixture);
  bad.kalshi_confidence_gate_contract_id = "kcgc_" + "a".repeat(32);
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 4: Gate structure
// ---------------------------------------------------------------------------

test("missing required gate (signal_calibration) fails", () => {
  const bad = clone(fixture);
  bad.gates = bad.gates.filter((g) => g.gate_id !== "signal_calibration");
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

test("duplicate gate_id fails", () => {
  const bad = clone(fixture);
  bad.gates = [...bad.gates, clone(bad.gates[0])];
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

test("unknown gate_id fails", () => {
  const bad = clone(fixture);
  bad.gates = [...bad.gates, {
    gate_id: "unknown_gate",
    gate_name: "Unknown Gate",
    gate_status: "blocked",
    required_before_phase: "Phase 6",
    evidence_required: true,
    minimum_requirements: ["something_required"],
    current_evidence_status: "not_evaluated",
    blocking_reason: "unknown gate",
  }];
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 5: Forbidden gate statuses
// ---------------------------------------------------------------------------

test("gate_status 'passed' fails", () => {
  const bad = clone(fixture);
  bad.gates[0].gate_status = "passed";
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

test("gate_status 'approved' fails", () => {
  const bad = clone(fixture);
  bad.gates[0].gate_status = "approved";
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

test("gate_status 'ready' fails", () => {
  const bad = clone(fixture);
  bad.gates[0].gate_status = "ready";
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

test("gate_status 'live_ready' fails", () => {
  const bad = clone(fixture);
  bad.gates[0].gate_status = "live_ready";
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 6: Safety flags
// ---------------------------------------------------------------------------

test("overall_gate_status other than 'blocked' fails", () => {
  const bad = clone(fixture);
  // Must also recompute ID or use non-deterministic, so just check validation catches it
  bad.overall_gate_status = "open";
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

test("phase_6_ready true fails", () => {
  const bad = clone(fixture);
  bad.phase_6_ready = true;
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

test("live_mode_allowed true fails", () => {
  const bad = clone(fixture);
  bad.live_mode_allowed = true;
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

test("credentials_allowed true fails", () => {
  const bad = clone(fixture);
  bad.credentials_allowed = true;
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

test("order_placement_allowed true fails", () => {
  const bad = clone(fixture);
  bad.order_placement_allowed = true;
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

test("autonomous_execution_allowed true fails", () => {
  const bad = clone(fixture);
  bad.autonomous_execution_allowed = true;
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

test("operator_signoff_complete true fails", () => {
  const bad = clone(fixture);
  bad.operator_signoff_complete = true;
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

test("risk_governor_required false fails", () => {
  const bad = clone(fixture);
  bad.risk_governor_required = false;
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

test("operator_signoff_required false fails", () => {
  const bad = clone(fixture);
  bad.operator_signoff_required = false;
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

test("paper_only false fails", () => {
  const bad = clone(fixture);
  bad.paper_only = false;
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 7: Source artifacts
// ---------------------------------------------------------------------------

test("missing source artifact requirement (market_snapshot) fails", () => {
  const bad = clone(fixture);
  delete bad.required_source_artifacts.market_snapshot;
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

test("wrong source artifact schema version fails", () => {
  const bad = clone(fixture);
  bad.required_source_artifacts.market_snapshot.schema_version = "kalshi_market_snapshot.v99";
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

test("required source artifact flag false fails", () => {
  const bad = clone(fixture);
  bad.required_source_artifacts.paper_ledger_entry.required = false;
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 8: Forbidden field names
// ---------------------------------------------------------------------------

test("forbidden field name 'api_key' recursively fails", () => {
  const bad = clone(fixture);
  bad.api_key = "should-not-exist";
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

test("forbidden field name 'live_order' in nested object fails", () => {
  const bad = clone(fixture);
  bad.gates[0].live_order = "nested-forbidden";
  // This will also fail for unknown gate field — both are caught
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 9: Forbidden string values
// ---------------------------------------------------------------------------

test("reason with 'approved for live' fails", () => {
  const bad = clone(fixture);
  bad.reason = "approved for live trading";
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

test("reason with 'place order' fails", () => {
  const bad = clone(fixture);
  bad.reason = "ready to place order";
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

test("reason with 'bankroll allocation' fails", () => {
  const bad = clone(fixture);
  bad.reason = "bankroll allocation determined";
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

test("blocking_reason with unsafe live/order language fails", () => {
  const bad = clone(fixture);
  bad.gates[0].blocking_reason = "go live now";
  const { valid } = validateKalshiConfidenceGateContract(bad);
  assert.equal(valid, false);
});

// ---------------------------------------------------------------------------
// Group 10: Structural safety field name exemptions
// ---------------------------------------------------------------------------

test("structural safety flag field names pass (no false positive on field names)", () => {
  // These field names contain forbidden substrings but are approved structural fields.
  // The valid fixture contains all of them — verify it still passes.
  const result = validateKalshiConfidenceGateContract(fixture);
  assert.equal(result.valid, true, `unexpected errors: ${result.errors.join(", ")}`);
  // Spot-check the relevant fields are present in the fixture
  assert.ok("order_placement_allowed" in fixture);
  assert.ok("credentials_allowed" in fixture);
  assert.ok("autonomous_execution_allowed" in fixture);
  assert.ok("operator_signoff_required" in fixture);
  assert.ok("operator_signoff_complete" in fixture);
  assert.ok("risk_governor_required" in fixture);
});
