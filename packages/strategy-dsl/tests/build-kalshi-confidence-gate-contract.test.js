/**
 * build-kalshi-confidence-gate-contract.test.js
 *
 * Phase 5A — Builder tests for KalshiConfidenceGateContract.
 * 11 tests.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildKalshiConfidenceGateContract,
  REQUIRED_GATE_IDS,
  APPROVED_GATE_STATUSES,
} from "../src/build-kalshi-confidence-gate-contract.js";

const FIXTURE_PATH =
  "packages/strategy-dsl/fixtures/synthetic_kalshi_confidence_gate_contract.json";

const fixture = JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));

// Test 1: builder output deepEquals synthetic fixture
test("builder output deepEquals synthetic fixture", () => {
  const result = buildKalshiConfidenceGateContract({
    generatedAt: "2026-05-12T00:00:00Z",
  });
  assert.deepEqual(result, fixture);
});

// Test 2: ID is deterministic with kcgc_ prefix
test("ID is deterministic with kcgc_ prefix", () => {
  const result = buildKalshiConfidenceGateContract();
  assert.match(result.kalshi_confidence_gate_contract_id, /^kcgc_[a-f0-9]{32}$/);
  const result2 = buildKalshiConfidenceGateContract();
  assert.equal(
    result.kalshi_confidence_gate_contract_id,
    result2.kalshi_confidence_gate_contract_id
  );
});

// Test 3: all five required gates present
test("all five required gates present", () => {
  const result = buildKalshiConfidenceGateContract();
  const gateIds = result.gates.map((g) => g.gate_id);
  for (const id of REQUIRED_GATE_IDS) {
    assert.ok(gateIds.includes(id), `missing gate: ${id}`);
  }
  assert.equal(gateIds.length, 5);
});

// Test 4: overall_gate_status is blocked
test("overall_gate_status is blocked", () => {
  const result = buildKalshiConfidenceGateContract();
  assert.equal(result.overall_gate_status, "blocked");
});

// Test 5: phase_6_ready is false
test("phase_6_ready is false", () => {
  const result = buildKalshiConfidenceGateContract();
  assert.equal(result.phase_6_ready, false);
});

// Test 6: live/order/credential/autonomous flags all false
test("live/order/credential/autonomous flags all false", () => {
  const result = buildKalshiConfidenceGateContract();
  assert.equal(result.live_mode_allowed, false);
  assert.equal(result.credentials_allowed, false);
  assert.equal(result.order_placement_allowed, false);
  assert.equal(result.autonomous_execution_allowed, false);
});

// Test 7: operator signoff incomplete
test("operator_signoff_complete is false", () => {
  const result = buildKalshiConfidenceGateContract();
  assert.equal(result.operator_signoff_complete, false);
});

// Test 8: risk_governor_required is true
test("risk_governor_required is true", () => {
  const result = buildKalshiConfidenceGateContract();
  assert.equal(result.risk_governor_required, true);
});

// Test 9: operator_signoff_required is true
test("operator_signoff_required is true", () => {
  const result = buildKalshiConfidenceGateContract();
  assert.equal(result.operator_signoff_required, true);
});

// Test 10: source artifact requirements present with correct schema versions and required true
test("required_source_artifacts are present with correct schema versions", () => {
  const result = buildKalshiConfidenceGateContract();
  const rsa = result.required_source_artifacts;
  assert.ok(rsa, "required_source_artifacts must be present");
  assert.equal(rsa.market_snapshot.schema_version, "kalshi_market_snapshot.v1");
  assert.equal(rsa.market_snapshot.required, true);
  assert.equal(
    rsa.strategy_signal_definition.schema_version,
    "kalshi_strategy_signal_definition.v1"
  );
  assert.equal(rsa.strategy_signal_definition.required, true);
  assert.equal(
    rsa.signal_evaluation_summary.schema_version,
    "kalshi_signal_evaluation_summary.v1"
  );
  assert.equal(rsa.signal_evaluation_summary.required, true);
  assert.equal(rsa.paper_ledger_entry.schema_version, "kalshi_paper_ledger_entry.v1");
  assert.equal(rsa.paper_ledger_entry.required, true);
});

// Test 11: no gate has passed/approved/ready/live_ready status
test("no gate has forbidden status (passed/approved/ready/live_ready/complete)", () => {
  const forbidden = new Set(["passed", "approved", "ready", "live_ready", "complete"]);
  const result = buildKalshiConfidenceGateContract();
  for (const gate of result.gates) {
    assert.ok(
      !forbidden.has(gate.gate_status),
      `gate "${gate.gate_id}" has forbidden status "${gate.gate_status}"`
    );
    assert.ok(
      APPROVED_GATE_STATUSES.has(gate.gate_status),
      `gate "${gate.gate_id}" has unapproved status "${gate.gate_status}"`
    );
  }
});
