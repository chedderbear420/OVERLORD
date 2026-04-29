import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { readJsonl } from "../../event-store/src/jsonl.js";
import { buildPaperLedgerEntry } from "../src/build-paper-ledger-entry.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const actionPath = path.join(repoRoot, "packages", "risk-governor", "fixtures", "synthetic_action_decisions.jsonl");
const riskPath = path.join(repoRoot, "packages", "risk-governor", "fixtures", "synthetic_risk_decisions.jsonl");
const ledgerFixturePath = path.join(repoRoot, "packages", "paper-trader", "fixtures", "synthetic_paper_ledger_entries.jsonl");

test("buildPaperLedgerEntry preserves ActionDecision and RiskDecision provenance", async () => {
  const { approvedAction, riskById } = await loadInputs();
  const entry = buildPaperLedgerEntry(approvedAction, riskById.get(approvedAction.source_risk_decision_id));

  assert.equal(entry.source_action_decision_id, approvedAction.action_decision_id);
  assert.equal(entry.source_risk_decision_id, approvedAction.source_risk_decision_id);
  assert.equal(entry.source_signal_id, approvedAction.source_signal_id);
  assert.equal(entry.source_state_id, approvedAction.source_state_id);
  assert.equal(entry.source_event_id, approvedAction.source_event_id);
  assert.equal(entry.source_payload_hash, approvedAction.source_payload_hash);
  assert.equal(entry.market_id, approvedAction.market_id);
  assert.equal(entry.paper_only, true);
  assert.equal(entry.live_execution_allowed, false);
  assert.equal(entry.order_placement_allowed, false);
  assert.equal(entry.status, "paper_open");
  assert.equal(entry.final_pnl_cents, null);
});

test("synthetic paper ledger fixture matches generated entries", async () => {
  const { actions, riskById } = await loadInputs();
  const generated = actions
    .filter((action) => action.action_status === "paper_candidate_allowed")
    .map((action) => buildPaperLedgerEntry(action, riskById.get(action.source_risk_decision_id)));
  const fixture = (await readJsonl(ledgerFixturePath)).map((record) => record.value);

  assert.deepEqual(generated, fixture);
});

test("rejected and unsafe actions cannot create paper ledger entries", async () => {
  const { actions, riskById } = await loadInputs();
  const rejectedAction = actions.find((action) => action.action_status === "rejected");
  assert.throws(
    () => buildPaperLedgerEntry(rejectedAction, riskById.get(rejectedAction.source_risk_decision_id)),
    /action_status must be paper_candidate_allowed/
  );

  const unsafeAction = { ...actions[0], live_execution_allowed: true };
  assert.throws(
    () => buildPaperLedgerEntry(unsafeAction, riskById.get(unsafeAction.source_risk_decision_id)),
    /live_execution_allowed must be false/
  );
});

test("paper quantity and notional are deterministic integer cents", async () => {
  const { approvedAction, riskById } = await loadInputs();
  const entry = buildPaperLedgerEntry(approvedAction, riskById.get(approvedAction.source_risk_decision_id));

  assert.equal(entry.paper_entry_price, 51);
  assert.equal(entry.paper_quantity, 196);
  assert.equal(entry.notional_cents, 9996);
  assert.ok(entry.notional_cents <= entry.max_paper_exposure_cents);
});

async function loadInputs() {
  const actions = (await readJsonl(actionPath)).map((record) => record.value);
  const risks = (await readJsonl(riskPath)).map((record) => record.value);
  const riskById = new Map(risks.map((risk) => [risk.risk_decision_id, risk]));
  const approvedAction = actions.find((action) => action.action_status === "paper_candidate_allowed");

  return { actions, riskById, approvedAction };
}
