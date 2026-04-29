import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { readJsonl } from "../../event-store/src/jsonl.js";
import { buildRiskDecision, buildRiskDecisions } from "../src/build-risk-decision.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const policyPath = path.join(repoRoot, "packages", "risk-governor", "fixtures", "default_risk_policy.json");
const edgeSignalPath = path.join(repoRoot, "packages", "edge-scanner", "fixtures", "synthetic_edge_signals.jsonl");
const riskDecisionPath = path.join(repoRoot, "packages", "risk-governor", "fixtures", "synthetic_risk_decisions.jsonl");

test("buildRiskDecision preserves EdgeSignal provenance", async () => {
  const policy = await loadPolicy();
  const [signal] = await loadSignals();
  const decision = buildRiskDecision(signal, policy);

  assert.equal(decision.source_signal_id, signal.signal_id);
  assert.equal(decision.source_state_id, signal.source_state_id);
  assert.equal(decision.source_event_id, signal.source_event_id);
  assert.equal(decision.source_payload_hash, signal.source_payload_hash);
  assert.equal(decision.market_id, signal.market_id);
  assert.equal(decision.risk_status, "risk_approved");
});

test("synthetic risk decisions match generated decisions", async () => {
  const policy = await loadPolicy();
  const signals = await loadSignals();
  const expected = await loadRiskDecisions();

  assert.deepEqual(buildRiskDecisions(signals, policy), expected);
});

async function loadPolicy() {
  return JSON.parse(await readFile(policyPath, "utf8"));
}

async function loadSignals() {
  const records = await readJsonl(edgeSignalPath);
  return records.map((record) => record.value);
}

async function loadRiskDecisions() {
  const records = await readJsonl(riskDecisionPath);
  return records.map((record) => record.value);
}
