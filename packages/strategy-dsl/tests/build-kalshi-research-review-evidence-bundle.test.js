/**
 * build-kalshi-research-review-evidence-bundle.test.js
 *
 * Phase 5B — Builder tests for KalshiResearchReviewEvidenceBundle.
 * 13 tests.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildKalshiResearchReviewEvidenceBundle,
  REQUIRED_GATE_IDS,
  APPROVED_EVIDENCE_TYPES,
} from "../src/build-kalshi-research-review-evidence-bundle.js";

const FIXTURE_PATH =
  "packages/strategy-dsl/fixtures/synthetic_kalshi_research_review_evidence_bundle.json";

const fixture = JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));

// Source fixture loaders
const cgcFixture = JSON.parse(
  readFileSync("packages/strategy-dsl/fixtures/synthetic_kalshi_confidence_gate_contract.json", "utf8")
);
const kmsFixture = JSON.parse(
  readFileSync("packages/strategy-dsl/fixtures/synthetic_kalshi_market_snapshot.json", "utf8")
);
const kssdFixture = JSON.parse(
  readFileSync("packages/strategy-dsl/fixtures/synthetic_kalshi_strategy_signal_definition.json", "utf8")
);
const ksesFixture = JSON.parse(
  readFileSync("packages/strategy-dsl/fixtures/synthetic_kalshi_signal_evaluation_summary.json", "utf8")
);
const kpleFixture = JSON.parse(
  readFileSync("packages/strategy-dsl/fixtures/synthetic_kalshi_paper_ledger_entry.json", "utf8")
);

const sourceArtifacts = {
  marketSnapshot: kmsFixture,
  strategySignalDefinition: kssdFixture,
  signalEvaluationSummary: ksesFixture,
  paperLedgerEntry: kpleFixture,
};

// Test 1: builder output deepEquals synthetic fixture
test("builder output deepEquals synthetic fixture", () => {
  const result = buildKalshiResearchReviewEvidenceBundle(cgcFixture, sourceArtifacts, {
    generatedAt: "2026-05-12T00:00:00Z",
  });
  assert.deepEqual(result, fixture);
});

// Test 2: ID is deterministic with krreb_ prefix
test("ID is deterministic with krreb_ prefix", () => {
  const result = buildKalshiResearchReviewEvidenceBundle(cgcFixture, sourceArtifacts);
  assert.match(result.kalshi_research_review_evidence_bundle_id, /^krreb_[a-f0-9]{32}$/);
  const result2 = buildKalshiResearchReviewEvidenceBundle(cgcFixture, sourceArtifacts);
  assert.equal(
    result.kalshi_research_review_evidence_bundle_id,
    result2.kalshi_research_review_evidence_bundle_id
  );
});

// Test 3: all required input artifact refs present
test("all required input artifact refs present", () => {
  const result = buildKalshiResearchReviewEvidenceBundle(cgcFixture, sourceArtifacts);
  const refs = result.input_artifact_refs;
  assert.ok(refs, "input_artifact_refs must be present");
  assert.ok("confidence_gate_contract" in refs, "missing confidence_gate_contract");
  assert.ok("market_snapshot" in refs, "missing market_snapshot");
  assert.ok("strategy_signal_definition" in refs, "missing strategy_signal_definition");
  assert.ok("signal_evaluation_summary" in refs, "missing signal_evaluation_summary");
  assert.ok("paper_ledger_entry" in refs, "missing paper_ledger_entry");
  for (const [key, ref] of Object.entries(refs)) {
    assert.equal(ref.required, true, `${key}.required must be true`);
    assert.ok(typeof ref.artifact_id === "string" && ref.artifact_id.length > 0, `${key}.artifact_id must be non-empty`);
  }
});

// Test 4: all evidence items have unique IDs
test("all evidence items have unique IDs", () => {
  const result = buildKalshiResearchReviewEvidenceBundle(cgcFixture, sourceArtifacts);
  const ids = result.evidence_items.map((e) => e.evidence_id);
  const unique = new Set(ids);
  assert.equal(unique.size, ids.length, "evidence IDs must be unique");
});

// Test 5: all required evidence types present
test("all required evidence types present", () => {
  const result = buildKalshiResearchReviewEvidenceBundle(cgcFixture, sourceArtifacts);
  const types = new Set(result.evidence_items.map((e) => e.evidence_type));
  for (const t of APPROVED_EVIDENCE_TYPES) {
    assert.ok(types.has(t), `missing evidence_type: ${t}`);
  }
});

// Test 6: gate evidence map includes all five gates
test("gate evidence map includes all five gates", () => {
  const result = buildKalshiResearchReviewEvidenceBundle(cgcFixture, sourceArtifacts);
  for (const gid of REQUIRED_GATE_IDS) {
    assert.ok(gid in result.gate_evidence_map, `missing gate in map: ${gid}`);
  }
  assert.equal(Object.keys(result.gate_evidence_map).length, 5);
});

// Test 7: risk_governor is missing_future_evidence with empty IDs
test("risk_governor is missing_future_evidence with empty mapped_evidence_ids", () => {
  const result = buildKalshiResearchReviewEvidenceBundle(cgcFixture, sourceArtifacts);
  const rg = result.gate_evidence_map.risk_governor;
  assert.equal(rg.evidence_status, "missing_future_evidence");
  assert.deepEqual(rg.mapped_evidence_ids, []);
});

// Test 8: operator_signoff is missing_future_evidence with empty IDs
test("operator_signoff is missing_future_evidence with empty mapped_evidence_ids", () => {
  const result = buildKalshiResearchReviewEvidenceBundle(cgcFixture, sourceArtifacts);
  const os = result.gate_evidence_map.operator_signoff;
  assert.equal(os.evidence_status, "missing_future_evidence");
  assert.deepEqual(os.mapped_evidence_ids, []);
});

// Test 9: gate_evaluation_allowed is false
test("gate_evaluation_allowed is false", () => {
  const result = buildKalshiResearchReviewEvidenceBundle(cgcFixture, sourceArtifacts);
  assert.equal(result.gate_evaluation_allowed, false);
});

// Test 10: gates_passed is false
test("gates_passed is false", () => {
  const result = buildKalshiResearchReviewEvidenceBundle(cgcFixture, sourceArtifacts);
  assert.equal(result.gates_passed, false);
});

// Test 11: phase_6_ready is false
test("phase_6_ready is false", () => {
  const result = buildKalshiResearchReviewEvidenceBundle(cgcFixture, sourceArtifacts);
  assert.equal(result.phase_6_ready, false);
});

// Test 12: live/order/credential/autonomous flags all false
test("live/order/credential/autonomous flags all false", () => {
  const result = buildKalshiResearchReviewEvidenceBundle(cgcFixture, sourceArtifacts);
  assert.equal(result.live_mode_allowed, false);
  assert.equal(result.credentials_allowed, false);
  assert.equal(result.order_placement_allowed, false);
  assert.equal(result.autonomous_execution_allowed, false);
});

// Test 13: operator signoff incomplete and paper_only true
test("operator_signoff_complete is false and paper_only is true", () => {
  const result = buildKalshiResearchReviewEvidenceBundle(cgcFixture, sourceArtifacts);
  assert.equal(result.operator_signoff_complete, false);
  assert.equal(result.paper_only, true);
});
