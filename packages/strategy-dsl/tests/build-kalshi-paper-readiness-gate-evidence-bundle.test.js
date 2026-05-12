/**
 * build-kalshi-paper-readiness-gate-evidence-bundle.test.js
 *
 * Phase 5C — Builder tests for KalshiPaperReadinessGateEvidenceBundle.
 * 14 tests.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildKalshiPaperReadinessGateEvidenceBundle } from "../src/build-kalshi-paper-readiness-gate-evidence-bundle.js";

const CGC_FIXTURE_PATH =
  "packages/strategy-dsl/fixtures/synthetic_kalshi_confidence_gate_contract.json";
const KRREB_FIXTURE_PATH =
  "packages/strategy-dsl/fixtures/synthetic_kalshi_research_review_evidence_bundle.json";
const EXPECTED_FIXTURE_PATH =
  "packages/strategy-dsl/fixtures/synthetic_kalshi_paper_readiness_gate_evidence_bundle.json";

const cgcFixture = JSON.parse(readFileSync(CGC_FIXTURE_PATH, "utf8"));
const krrebFixture = JSON.parse(readFileSync(KRREB_FIXTURE_PATH, "utf8"));
const expectedFixture = JSON.parse(readFileSync(EXPECTED_FIXTURE_PATH, "utf8"));

// ---------------------------------------------------------------------------
// Group 1: Deep equality with synthetic fixture
// ---------------------------------------------------------------------------

test("builder output deepEquals synthetic fixture", () => {
  const bundle = buildKalshiPaperReadinessGateEvidenceBundle(
    cgcFixture,
    krrebFixture,
    { generatedAt: "2026-05-12T00:00:00Z" }
  );
  assert.deepEqual(bundle, expectedFixture);
});

// ---------------------------------------------------------------------------
// Group 2: ID properties
// ---------------------------------------------------------------------------

test("ID has kprgeb_ prefix", () => {
  const bundle = buildKalshiPaperReadinessGateEvidenceBundle(cgcFixture, krrebFixture);
  assert.ok(bundle.kalshi_paper_readiness_gate_evidence_bundle_id.startsWith("kprgeb_"));
});

test("ID matches expected fixture ID", () => {
  const bundle = buildKalshiPaperReadinessGateEvidenceBundle(cgcFixture, krrebFixture);
  assert.equal(
    bundle.kalshi_paper_readiness_gate_evidence_bundle_id,
    "kprgeb_94e7954d365d17782ed327761cf2e261"
  );
});

test("ID is deterministic across two calls", () => {
  const a = buildKalshiPaperReadinessGateEvidenceBundle(cgcFixture, krrebFixture);
  const b = buildKalshiPaperReadinessGateEvidenceBundle(cgcFixture, krrebFixture);
  assert.equal(
    a.kalshi_paper_readiness_gate_evidence_bundle_id,
    b.kalshi_paper_readiness_gate_evidence_bundle_id
  );
});

// ---------------------------------------------------------------------------
// Group 3: Upstream bundle refs
// ---------------------------------------------------------------------------

test("upstream_evidence_bundle_ids contains CGC ID", () => {
  const bundle = buildKalshiPaperReadinessGateEvidenceBundle(cgcFixture, krrebFixture);
  assert.ok(
    bundle.upstream_evidence_bundle_ids.includes(
      cgcFixture.kalshi_confidence_gate_contract_id
    )
  );
});

test("upstream_evidence_bundle_ids contains KRREB ID", () => {
  const bundle = buildKalshiPaperReadinessGateEvidenceBundle(cgcFixture, krrebFixture);
  assert.ok(
    bundle.upstream_evidence_bundle_ids.includes(
      krrebFixture.kalshi_research_review_evidence_bundle_id
    )
  );
});

test("upstream_bundle_count equals upstream_evidence_bundle_ids.length", () => {
  const bundle = buildKalshiPaperReadinessGateEvidenceBundle(cgcFixture, krrebFixture);
  assert.equal(
    bundle.upstream_bundle_count,
    bundle.upstream_evidence_bundle_ids.length
  );
});

// ---------------------------------------------------------------------------
// Group 4: Readiness checks
// ---------------------------------------------------------------------------

test("signal_calibration_evidence_present is true", () => {
  const bundle = buildKalshiPaperReadinessGateEvidenceBundle(cgcFixture, krrebFixture);
  assert.equal(bundle.readiness_checks.signal_calibration_evidence_present, true);
});

test("edge_consistency_evidence_present is false", () => {
  const bundle = buildKalshiPaperReadinessGateEvidenceBundle(cgcFixture, krrebFixture);
  assert.equal(bundle.readiness_checks.edge_consistency_evidence_present, false);
});

test("paper_pnl_evidence_present is true", () => {
  const bundle = buildKalshiPaperReadinessGateEvidenceBundle(cgcFixture, krrebFixture);
  assert.equal(bundle.readiness_checks.paper_pnl_evidence_present, true);
});

test("replay_evidence_present is false", () => {
  const bundle = buildKalshiPaperReadinessGateEvidenceBundle(cgcFixture, krrebFixture);
  assert.equal(bundle.readiness_checks.replay_evidence_present, false);
});

test("market_ingest_evidence_present is true", () => {
  const bundle = buildKalshiPaperReadinessGateEvidenceBundle(cgcFixture, krrebFixture);
  assert.equal(bundle.readiness_checks.market_ingest_evidence_present, true);
});

// ---------------------------------------------------------------------------
// Group 5: Safety flags
// ---------------------------------------------------------------------------

test("safety_flags.paper_only is true", () => {
  const bundle = buildKalshiPaperReadinessGateEvidenceBundle(cgcFixture, krrebFixture);
  assert.equal(bundle.safety_flags.paper_only, true);
});

test("all blocking safety_flags are false", () => {
  const bundle = buildKalshiPaperReadinessGateEvidenceBundle(cgcFixture, krrebFixture);
  const sf = bundle.safety_flags;
  assert.equal(sf.live_execution_allowed, false);
  assert.equal(sf.live_mode_allowed, false);
  assert.equal(sf.order_placement_allowed, false);
  assert.equal(sf.credentials_allowed, false);
  assert.equal(sf.credential_access_allowed, false);
  assert.equal(sf.autonomous_execution_allowed, false);
  assert.equal(sf.gate_evaluation_allowed, false);
  assert.equal(sf.gates_passed, false);
  assert.equal(sf.phase_6_ready, false);
  assert.equal(sf.operator_signoff_complete, false);
});
