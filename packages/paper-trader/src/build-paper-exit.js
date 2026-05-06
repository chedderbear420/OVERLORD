import { paperExitId } from "./paper-exit-id.js";
import { calculatePaperPnl, validatePrice } from "./pnl-math.js";

export function buildPaperExit(ledgerEntry, exitPriceRecord) {
  validateLedgerEntryForPaperExit(ledgerEntry);
  validateExitPriceRecord(ledgerEntry, exitPriceRecord);

  const pnl = calculatePaperPnl({
    paper_entry_price: ledgerEntry.paper_entry_price,
    paper_exit_price: exitPriceRecord.paper_exit_price,
    paper_quantity: ledgerEntry.paper_quantity
  });

  return {
    paper_exit_id: paperExitId(ledgerEntry.paper_ledger_entry_id, exitPriceRecord.received_at),
    schema_version: "paper_exit.v1",
    source_paper_ledger_entry_id: ledgerEntry.paper_ledger_entry_id,
    source_action_decision_id: ledgerEntry.source_action_decision_id,
    source_risk_decision_id: ledgerEntry.source_risk_decision_id,
    source_signal_id: ledgerEntry.source_signal_id,
    source_state_id: ledgerEntry.source_state_id,
    source_event_id: ledgerEntry.source_event_id,
    source_payload_hash: ledgerEntry.source_payload_hash,
    market_id: ledgerEntry.market_id,
    captured_at: exitPriceRecord.captured_at,
    received_at: exitPriceRecord.received_at,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    exit_event_type: "paper_exit_recorded",
    side: ledgerEntry.side,
    paper_entry_price: ledgerEntry.paper_entry_price,
    paper_exit_price: exitPriceRecord.paper_exit_price,
    paper_quantity: ledgerEntry.paper_quantity,
    entry_notional_cents: pnl.entry_notional_cents,
    exit_notional_cents: pnl.exit_notional_cents,
    gross_pnl_cents: pnl.gross_pnl_cents,
    estimated_fee_cents: pnl.estimated_fee_cents,
    net_pnl_cents: pnl.net_pnl_cents,
    status: "paper_closed",
    reason: "Simulated paper exit recorded from local synthetic exit price. No real order created."
  };
}

export function validateLedgerEntryForPaperExit(ledgerEntry) {
  if (ledgerEntry.paper_only !== true) {
    throw new Error("paper_only must be true to create a paper exit");
  }
  if (ledgerEntry.live_execution_allowed !== false) {
    throw new Error("live_execution_allowed must be false to create a paper exit");
  }
  if (ledgerEntry.order_placement_allowed !== false) {
    throw new Error("order_placement_allowed must be false to create a paper exit");
  }
  if (ledgerEntry.status !== "paper_open") {
    throw new Error("PaperLedgerEntry status must be paper_open to create a paper exit");
  }
  if (ledgerEntry.ledger_event_type !== "paper_entry_recorded") {
    throw new Error("PaperLedgerEntry ledger_event_type must be paper_entry_recorded to create a paper exit");
  }
  if (!["YES", "NO"].includes(ledgerEntry.side)) {
    throw new Error("PaperLedgerEntry side must be YES or NO");
  }
  validatePrice(ledgerEntry.paper_entry_price, "paper_entry_price");
  if (!Number.isInteger(ledgerEntry.paper_quantity) || ledgerEntry.paper_quantity <= 0) {
    throw new Error("paper_quantity must be a positive integer to create a paper exit");
  }
}

function validateExitPriceRecord(ledgerEntry, exitPriceRecord) {
  if (!exitPriceRecord) {
    throw new Error("matching synthetic exit price record is required");
  }
  if (exitPriceRecord.source_paper_ledger_entry_id !== ledgerEntry.paper_ledger_entry_id) {
    throw new Error("exit price record must reference source_paper_ledger_entry_id");
  }
  if (exitPriceRecord.market_id !== ledgerEntry.market_id) {
    throw new Error("exit price record market_id must match ledger entry market_id");
  }
  validatePrice(exitPriceRecord.paper_exit_price, "paper_exit_price");
  const capturedAt = Date.parse(exitPriceRecord.captured_at);
  const receivedAt = Date.parse(exitPriceRecord.received_at);
  if (Number.isNaN(capturedAt) || Number.isNaN(receivedAt)) {
    throw new Error("exit price captured_at and received_at must be valid timestamps");
  }
  if (receivedAt < capturedAt) {
    throw new Error("exit price received_at must be equal to or after captured_at");
  }
}
