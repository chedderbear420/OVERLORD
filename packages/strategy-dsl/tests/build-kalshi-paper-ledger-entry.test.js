import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  buildKalshiPaperLedgerEntry,
  defaultLedgerOptions,
} from "../src/build-kalshi-paper-ledger-entry.js";
import { kalshiPaperLedgerEntryId } from "../src/kalshi-paper-ledger-entry-id.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");

async function loadFixture(name) {
  const p = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", name);
  return JSON.parse(await readFile(p, "utf8"));
}

// 1. Builder output deepEquals the committed fixture
test("builder output deepEquals the committed synthetic fixture", async () => {
  const evalFixture = await loadFixture("synthetic_kalshi_signal_evaluation_summary.json");
  const snapFixture = await loadFixture("synthetic_kalshi_market_snapshot.json");
  const committedFixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");

  const built = buildKalshiPaperLedgerEntry(evalFixture, snapFixture);
  assert.deepEqual(built, committedFixture);
});

// 2. Builder ID matches kalshiPaperLedgerEntryId for given inputs
test("builder ID matches kalshiPaperLedgerEntryId for given inputs", async () => {
  const evalFixture = await loadFixture("synthetic_kalshi_signal_evaluation_summary.json");
  const snapFixture = await loadFixture("synthetic_kalshi_market_snapshot.json");

  const built = buildKalshiPaperLedgerEntry(evalFixture, snapFixture);
  const expected = kalshiPaperLedgerEntryId({
    signalEvaluationSummaryId: evalFixture.kalshi_signal_evaluation_summary_id,
    marketSnapshotId: snapFixture.kalshi_market_snapshot_id,
    ledgerMode: defaultLedgerOptions.ledgerMode,
    schemaVersion: "kalshi_paper_ledger_entry.v1",
    paperAccountingMode: defaultLedgerOptions.paperAccountingMode,
    paperContractSide: defaultLedgerOptions.paperContractSide,
  });
  assert.equal(built.kalshi_paper_ledger_entry_id, expected);
  assert.match(built.kalshi_paper_ledger_entry_id, /^kple_[a-f0-9]{32}$/u);
});

// 3. Builder paper_entry_price_cents equals last_price_cents from snapshot
test("builder paper_entry_price_cents equals last_price_cents from snapshot", async () => {
  const evalFixture = await loadFixture("synthetic_kalshi_signal_evaluation_summary.json");
  const snapFixture = await loadFixture("synthetic_kalshi_market_snapshot.json");

  const built = buildKalshiPaperLedgerEntry(evalFixture, snapFixture);
  assert.equal(built.paper_entry_price_cents, snapFixture.last_price_cents);
});

// 4. Builder paper_mark_price_cents equals last_price_cents from snapshot by default
test("builder paper_mark_price_cents equals last_price_cents from snapshot by default", async () => {
  const evalFixture = await loadFixture("synthetic_kalshi_signal_evaluation_summary.json");
  const snapFixture = await loadFixture("synthetic_kalshi_market_snapshot.json");

  const built = buildKalshiPaperLedgerEntry(evalFixture, snapFixture);
  assert.equal(built.paper_mark_price_cents, snapFixture.last_price_cents);
});

// 5. Builder paper_unrealized_pnl_cents = 0 when entry equals mark
test("builder paper_unrealized_pnl_cents = 0 when entry equals mark", async () => {
  const evalFixture = await loadFixture("synthetic_kalshi_signal_evaluation_summary.json");
  const snapFixture = await loadFixture("synthetic_kalshi_market_snapshot.json");

  const built = buildKalshiPaperLedgerEntry(evalFixture, snapFixture);
  assert.equal(
    built.paper_unrealized_pnl_cents,
    built.paper_mark_price_cents - built.paper_entry_price_cents
  );
  assert.equal(built.paper_unrealized_pnl_cents, 0);
});

// 6. Builder paper_realized_pnl_cents is null when paper_settlement_status is unsettled_fixture
test("builder paper_realized_pnl_cents is null for unsettled_fixture", async () => {
  const evalFixture = await loadFixture("synthetic_kalshi_signal_evaluation_summary.json");
  const snapFixture = await loadFixture("synthetic_kalshi_market_snapshot.json");

  const built = buildKalshiPaperLedgerEntry(evalFixture, snapFixture);
  assert.equal(built.paper_settlement_status, "unsettled_fixture");
  assert.equal(built.paper_realized_pnl_cents, null);
});

// 7. Builder paper_fees_cents defaults to 0; paper_net_pnl_cents = unrealized - fees
test("builder paper_fees_cents defaults to 0 and paper_net_pnl_cents = unrealized - fees", async () => {
  const evalFixture = await loadFixture("synthetic_kalshi_signal_evaluation_summary.json");
  const snapFixture = await loadFixture("synthetic_kalshi_market_snapshot.json");

  const built = buildKalshiPaperLedgerEntry(evalFixture, snapFixture);
  assert.equal(built.paper_fees_cents, 0);
  assert.equal(built.paper_net_pnl_cents, built.paper_unrealized_pnl_cents - built.paper_fees_cents);
  assert.equal(built.paper_net_pnl_cents, 0);
});

// 8. Builder with non-zero fee subtracts fees from net PnL (unrealized - fees)
test("builder with non-zero fee computes paper_net_pnl_cents = unrealized - fees", async () => {
  const evalFixture = await loadFixture("synthetic_kalshi_signal_evaluation_summary.json");
  const snapFixture = await loadFixture("synthetic_kalshi_market_snapshot.json");

  // entry=53, mark=53, unrealized=0, fees=3 → net = 0 - 3 = -3
  const built = buildKalshiPaperLedgerEntry(evalFixture, snapFixture, {
    paperFeeCents: 3,
  });
  assert.equal(built.paper_fees_cents, 3);
  assert.equal(built.paper_net_pnl_cents, built.paper_unrealized_pnl_cents - 3);
  assert.equal(built.paper_net_pnl_cents, -3);
});

// 9. Builder with non-default mark price computes paper_unrealized_pnl_cents correctly
test("builder with non-default paperMarkPriceCents computes paper_unrealized_pnl_cents correctly", async () => {
  const evalFixture = await loadFixture("synthetic_kalshi_signal_evaluation_summary.json");
  const snapFixture = await loadFixture("synthetic_kalshi_market_snapshot.json");

  // entry = 53, mark = 58 → unrealized = 5, fees = 0, net = 5 - 0 = 5
  const built = buildKalshiPaperLedgerEntry(evalFixture, snapFixture, {
    paperMarkPriceCents: 58,
  });
  assert.equal(built.paper_entry_price_cents, 53);
  assert.equal(built.paper_mark_price_cents, 58);
  assert.equal(built.paper_unrealized_pnl_cents, 5);
  assert.equal(built.paper_net_pnl_cents, 5);
});

// 10. Builder safety and emit flags are hardcoded and cannot be overridden by opts
test("builder safety and emit flags are hardcoded and cannot be overridden by opts", async () => {
  const evalFixture = await loadFixture("synthetic_kalshi_signal_evaluation_summary.json");
  const snapFixture = await loadFixture("synthetic_kalshi_market_snapshot.json");

  const built = buildKalshiPaperLedgerEntry(evalFixture, snapFixture, {
    paper_only: false,
    emits_orders: true,
    emits_live_positions: true,
    emits_paper_ledger_entries: true,
  });
  assert.equal(built.paper_only, true);
  assert.equal(built.live_execution_allowed, false);
  assert.equal(built.order_placement_allowed, false);
  assert.equal(built.credentials_used, false);
  assert.equal(built.network_request_used, false);
  assert.equal(built.emits_signal_events, false);
  assert.equal(built.emits_recommendations, false);
  assert.equal(built.emits_decisions, false);
  assert.equal(built.emits_orders, false);
  assert.equal(built.emits_live_positions, false);
  assert.equal(built.emits_paper_ledger_entries, false);
  assert.equal(built.paper_entry_status, "recorded_paper_observation");
  assert.equal(built.source_phase, "Phase 4P");
  assert.equal(built.reason_code, "PAPER_LEDGER_ENTRY_RECORDED");
});

// 11. Builder input_artifact_refs references both source artifacts correctly
test("builder input_artifact_refs references signal_evaluation_summary and market_snapshot correctly", async () => {
  const evalFixture = await loadFixture("synthetic_kalshi_signal_evaluation_summary.json");
  const snapFixture = await loadFixture("synthetic_kalshi_market_snapshot.json");

  const built = buildKalshiPaperLedgerEntry(evalFixture, snapFixture);
  assert.equal(
    built.input_artifact_refs.signal_evaluation_summary.artifact_id,
    evalFixture.kalshi_signal_evaluation_summary_id
  );
  assert.equal(
    built.input_artifact_refs.signal_evaluation_summary.schema_version,
    "kalshi_signal_evaluation_summary.v1"
  );
  assert.equal(
    built.input_artifact_refs.market_snapshot.artifact_id,
    snapFixture.kalshi_market_snapshot_id
  );
  assert.equal(
    built.input_artifact_refs.market_snapshot.schema_version,
    "kalshi_market_snapshot.v1"
  );
});

// 12. Builder pulls event_ticker from market snapshot
test("builder pulls event_ticker from market snapshot", async () => {
  const evalFixture = await loadFixture("synthetic_kalshi_signal_evaluation_summary.json");
  const snapFixture = await loadFixture("synthetic_kalshi_market_snapshot.json");

  const built = buildKalshiPaperLedgerEntry(evalFixture, snapFixture);
  assert.equal(built.event_ticker, snapFixture.event_ticker);
  assert.ok(typeof built.event_ticker === "string" && built.event_ticker.length > 0);
});

// 13. Builder pulls condition_family from signal evaluation summary
test("builder pulls condition_family from signal evaluation summary", async () => {
  const evalFixture = await loadFixture("synthetic_kalshi_signal_evaluation_summary.json");
  const snapFixture = await loadFixture("synthetic_kalshi_market_snapshot.json");

  const built = buildKalshiPaperLedgerEntry(evalFixture, snapFixture);
  assert.equal(built.condition_family, evalFixture.condition_family);
  assert.equal(built.condition_family, "descriptive_market_movement");
});

// 14. Builder paper_units is always 1
test("builder paper_units is always 1", async () => {
  const evalFixture = await loadFixture("synthetic_kalshi_signal_evaluation_summary.json");
  const snapFixture = await loadFixture("synthetic_kalshi_market_snapshot.json");

  const built = buildKalshiPaperLedgerEntry(evalFixture, snapFixture);
  assert.equal(built.paper_units, 1);
});
