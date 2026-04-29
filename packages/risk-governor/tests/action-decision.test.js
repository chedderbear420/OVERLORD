import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { readJsonl } from "../../event-store/src/jsonl.js";
import { buildActionDecision } from "../src/build-action-decision.js";
import { buildRiskDecisions } from "../src/build-risk-decision.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const policyPath = path.join(repoRoot, "packages", "risk-governor", "fixtures", "default_risk_policy.json");
const edgeSignalPath = path.join(repoRoot, "packages", "edge-scanner", "fixtures", "synthetic_edge_signals.jsonl");

test("approved risk decision becomes paper_candidate_allowed only", async () => {
  const [approved] = await loadRiskDecisions();
  const action = buildActionDecision(approved);

  assert.equal(action.action_status, "paper_candidate_allowed");
  assert.equal(action.paper_only, true);
  assert.equal(action.live_execution_allowed, false);
  assert.equal(action.order_placement_allowed, false);
  assert.equal(action.max_paper_exposure_cents, 10000);
  assert.match(action.reason, /No trade created/);
  assert.equal(Object.hasOwn(action, "order_id"), false);
  assert.equal(Object.hasOwn(action, "quantity"), false);
});

test("rejected risk decision becomes rejected action with no exposure", async () => {
  const [, rejected] = await loadRiskDecisions();
  const action = buildActionDecision(rejected);

  assert.equal(action.action_status, "rejected");
  assert.equal(action.max_paper_exposure_cents, 0);
  assert.equal(action.live_execution_allowed, false);
  assert.equal(action.order_placement_allowed, false);
});

async function loadRiskDecisions() {
  const policy = JSON.parse(await readFile(policyPath, "utf8"));
  const signalRecords = await readJsonl(edgeSignalPath);
  return buildRiskDecisions(signalRecords.map((record) => record.value), policy);
}
