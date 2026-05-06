import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validatePaperExitFile, validatePaperExitRecords } from "../src/validate-paper-exits.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const exitFixturePath = path.join(repoRoot, "packages", "paper-trader", "fixtures", "synthetic_paper_exits.jsonl");

test("synthetic PaperExit fixture validates", async () => {
  const report = await validatePaperExitFile({ filePath: exitFixturePath });

  assert.equal(report.ok, true);
  assert.equal(report.records, 1);
  assert.deepEqual(report.errors, []);
});

test("PaperExit validator rejects unsafe flags and bad P/L math", () => {
  const valid = makeExit("entry_a", "2026-04-28T14:05:01Z");
  const report = validatePaperExitRecords([
    { lineNumber: 1, value: { ...valid, live_execution_allowed: true } },
    { lineNumber: 2, value: { ...makeExit("entry_b", "2026-04-28T14:05:02Z"), gross_pnl_cents: 1 } }
  ]);

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /live_execution_allowed must be false/);
  assert.match(report.errors.join("\n"), /gross_pnl_cents must equal/);
});

test("PaperExit validator rejects duplicate ids and non-monotonic ordering", () => {
  const first = makeExit("entry_a", "2026-04-28T14:05:03Z");
  const second = {
    ...makeExit("entry_b", "2026-04-28T14:05:02Z"),
    paper_exit_id: first.paper_exit_id
  };
  const report = validatePaperExitRecords([
    { lineNumber: 1, value: first },
    { lineNumber: 2, value: second }
  ]);

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /paper_exit_id must be unique/);
  assert.match(report.errors.join("\n"), /received_at must be monotonic/);
});

function makeExit(ledgerId, receivedAt) {
  return {
    paper_exit_id: `exit_${ledgerId}_${receivedAt}`,
    schema_version: "paper_exit.v1",
    source_paper_ledger_entry_id: ledgerId,
    source_action_decision_id: "action_test",
    source_risk_decision_id: "risk_test",
    source_signal_id: "sig_test",
    source_state_id: "ms_test",
    source_event_id: "evt_test",
    source_payload_hash: "sha256:test",
    market_id: "TEST",
    captured_at: "2026-04-28T14:05:00Z",
    received_at: receivedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    exit_event_type: "paper_exit_recorded",
    side: "YES",
    paper_entry_price: 50,
    paper_exit_price: 55,
    paper_quantity: 2,
    entry_notional_cents: 100,
    exit_notional_cents: 110,
    gross_pnl_cents: 10,
    estimated_fee_cents: 0,
    net_pnl_cents: 10,
    status: "paper_closed",
    reason: "test"
  };
}
