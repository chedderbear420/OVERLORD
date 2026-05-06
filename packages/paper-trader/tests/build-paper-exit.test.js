import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { readJsonl } from "../../event-store/src/jsonl.js";
import { buildPaperExit } from "../src/build-paper-exit.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const ledgerPath = path.join(repoRoot, "packages", "paper-trader", "fixtures", "synthetic_paper_ledger_entries.jsonl");
const exitPricePath = path.join(repoRoot, "packages", "paper-trader", "fixtures", "synthetic_exit_prices.jsonl");
const exitFixturePath = path.join(repoRoot, "packages", "paper-trader", "fixtures", "synthetic_paper_exits.jsonl");

test("buildPaperExit preserves full PaperLedgerEntry provenance", async () => {
  const { ledgerEntry, exitPrice } = await loadInputs();
  const exit = buildPaperExit(ledgerEntry, exitPrice);

  assert.equal(exit.source_paper_ledger_entry_id, ledgerEntry.paper_ledger_entry_id);
  assert.equal(exit.source_action_decision_id, ledgerEntry.source_action_decision_id);
  assert.equal(exit.source_risk_decision_id, ledgerEntry.source_risk_decision_id);
  assert.equal(exit.source_signal_id, ledgerEntry.source_signal_id);
  assert.equal(exit.source_state_id, ledgerEntry.source_state_id);
  assert.equal(exit.source_event_id, ledgerEntry.source_event_id);
  assert.equal(exit.source_payload_hash, ledgerEntry.source_payload_hash);
  assert.equal(exit.market_id, ledgerEntry.market_id);
  assert.equal(exit.paper_only, true);
  assert.equal(exit.live_execution_allowed, false);
  assert.equal(exit.order_placement_allowed, false);
  assert.equal(exit.status, "paper_closed");
});

test("synthetic PaperExit fixture matches generated exit", async () => {
  const { ledgerEntry, exitPrice } = await loadInputs();
  const generated = [buildPaperExit(ledgerEntry, exitPrice)];
  const fixture = (await readJsonl(exitFixturePath)).map((record) => record.value);

  assert.deepEqual(generated, fixture);
});

test("buildPaperExit rejects paper_rejected and unsafe ledger entries", async () => {
  const { ledgerEntry, exitPrice } = await loadInputs();

  assert.throws(
    () => buildPaperExit({ ...ledgerEntry, status: "paper_rejected" }, exitPrice),
    /status must be paper_open/
  );
  assert.throws(
    () => buildPaperExit({ ...ledgerEntry, ledger_event_type: "paper_entry_rejected" }, exitPrice),
    /ledger_event_type must be paper_entry_recorded/
  );
  assert.throws(
    () => buildPaperExit({ ...ledgerEntry, live_execution_allowed: true }, exitPrice),
    /live_execution_allowed must be false/
  );
});

test("buildPaperExit rejects invalid exit price records", async () => {
  const { ledgerEntry, exitPrice } = await loadInputs();

  assert.throws(
    () => buildPaperExit(ledgerEntry, { ...exitPrice, paper_exit_price: 101 }),
    /paper_exit_price must be integer cents from 0 to 100/
  );
  assert.throws(
    () => buildPaperExit(ledgerEntry, { ...exitPrice, source_paper_ledger_entry_id: "wrong" }),
    /source_paper_ledger_entry_id/
  );
});

async function loadInputs() {
  const [ledgerEntry] = (await readJsonl(ledgerPath)).map((record) => record.value);
  const [exitPrice] = (await readJsonl(exitPricePath)).map((record) => record.value);

  return { ledgerEntry, exitPrice };
}
