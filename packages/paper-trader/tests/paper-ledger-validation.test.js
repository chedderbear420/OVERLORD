import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validatePaperLedgerFile, validatePaperLedgerRecords } from "../src/validate-paper-ledger.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const ledgerFixturePath = path.join(repoRoot, "packages", "paper-trader", "fixtures", "synthetic_paper_ledger_entries.jsonl");

test("synthetic paper ledger fixture validates", async () => {
  const report = await validatePaperLedgerFile({ filePath: ledgerFixturePath });

  assert.equal(report.ok, true);
  assert.equal(report.records, 1);
  assert.deepEqual(report.errors, []);
});

test("paper ledger validator rejects unsafe live/order flags and bad math", () => {
  const valid = {
    paper_ledger_entry_id: "paper_action_test",
    schema_version: "paper_ledger_entry.v1",
    source_action_decision_id: "action_test",
    source_risk_decision_id: "risk_test",
    source_signal_id: "sig_test",
    source_state_id: "ms_test",
    source_event_id: "evt_test",
    source_payload_hash: "sha256:test",
    market_id: "TEST",
    captured_at: "2026-04-28T14:00:02Z",
    received_at: "2026-04-28T14:00:03Z",
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    ledger_event_type: "paper_entry_recorded",
    side: "YES",
    paper_entry_price: 50,
    max_paper_exposure_cents: 100,
    paper_quantity: 2,
    notional_cents: 100,
    status: "paper_open",
    reason: "test",
    final_pnl_cents: null
  };

  const report = validatePaperLedgerRecords([
    { lineNumber: 1, value: { ...valid, live_execution_allowed: true } },
    { lineNumber: 2, value: { ...valid, paper_ledger_entry_id: "paper_action_test_2", source_action_decision_id: "action_test_2", notional_cents: 99 } }
  ]);

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /live_execution_allowed must be false/);
  assert.match(report.errors.join("\n"), /notional_cents must equal paper_entry_price \* paper_quantity/);
});

test("paper ledger validator rejects non-monotonic order and duplicate ids", () => {
  const first = makeEntry("action_a", "2026-04-28T14:00:03Z");
  const second = makeEntry("action_a", "2026-04-28T14:00:02Z");

  const report = validatePaperLedgerRecords([
    { lineNumber: 1, value: first },
    { lineNumber: 2, value: second }
  ]);

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /paper_ledger_entry_id must be unique/);
  assert.match(report.errors.join("\n"), /received_at must be monotonic/);
});

function makeEntry(actionId, receivedAt) {
  return {
    paper_ledger_entry_id: `paper_${actionId}`,
    schema_version: "paper_ledger_entry.v1",
    source_action_decision_id: actionId,
    source_risk_decision_id: "risk_test",
    source_signal_id: "sig_test",
    source_state_id: "ms_test",
    source_event_id: "evt_test",
    source_payload_hash: "sha256:test",
    market_id: "TEST",
    captured_at: "2026-04-28T14:00:01Z",
    received_at: receivedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    ledger_event_type: "paper_entry_recorded",
    side: "YES",
    paper_entry_price: 50,
    max_paper_exposure_cents: 100,
    paper_quantity: 2,
    notional_cents: 100,
    status: "paper_open",
    reason: "test",
    final_pnl_cents: null
  };
}
