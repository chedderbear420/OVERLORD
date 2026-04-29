import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { readJsonl } from "../../event-store/src/jsonl.js";
import { evaluateRiskChecks, validateRiskPolicy } from "../src/risk-checks.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const policyPath = path.join(repoRoot, "packages", "risk-governor", "fixtures", "default_risk_policy.json");
const edgeSignalPath = path.join(repoRoot, "packages", "edge-scanner", "fixtures", "synthetic_edge_signals.jsonl");

test("risk checks approve the positive descriptive EdgeSignal", async () => {
  const policy = await loadPolicy();
  const [signal] = await loadSignals();
  const result = evaluateRiskChecks(signal, policy);

  assert.equal(result.status, "risk_approved");
  assert.deepEqual(result.reasons, ["all_risk_checks_passed"]);
  assert.equal(result.totalEstimatedCost, 6.51);
});

test("risk checks reject low net edge", async () => {
  const policy = await loadPolicy();
  const signals = await loadSignals();
  const result = evaluateRiskChecks(signals[2], policy);

  assert.equal(result.status, "risk_rejected");
  assert.match(result.reasons.join(","), /net_edge_below_minimum/);
});

test("risk checks reject stale, illiquid, fatal quality, bad price, excessive cost, and bad side", async () => {
  const policy = await loadPolicy();
  const [base] = await loadSignals();

  assert.match(evaluateRiskChecks({ ...base, staleness_status: "stale" }, policy).reasons.join(","), /staleness_status_not_fresh/);
  assert.match(evaluateRiskChecks({ ...base, liquidity_status: "thin" }, policy).reasons.join(","), /liquidity_status_not_allowed/);
  assert.match(evaluateRiskChecks({ ...base, quality_flags: ["crossed_book"] }, policy).reasons.join(","), /fatal_quality_flags/);
  assert.match(evaluateRiskChecks({ ...base, observed_price: 100 }, policy).reasons.join(","), /observed_price_out_of_bounds/);
  assert.match(evaluateRiskChecks({ ...base, estimated_fee_cost: 20 }, policy).reasons.join(","), /estimated_cost_exceeds_maximum/);
  assert.match(evaluateRiskChecks({ ...base, side: "MAYBE" }, policy).reasons.join(","), /side_not_allowed/);
});

test("invalid policy needs review", async () => {
  const policy = await loadPolicy();
  const [signal] = await loadSignals();
  const badPolicy = { ...policy, mode: "live" };
  const result = evaluateRiskChecks(signal, badPolicy);

  assert.equal(result.status, "risk_needs_review");
  assert.match(result.reasons.join(","), /policy mode must be paper_only/);
  assert.deepEqual(validateRiskPolicy(badPolicy), ["policy mode must be paper_only"]);
});

async function loadPolicy() {
  return JSON.parse(await readFile(policyPath, "utf8"));
}

async function loadSignals() {
  const records = await readJsonl(edgeSignalPath);
  return records.map((record) => record.value);
}
