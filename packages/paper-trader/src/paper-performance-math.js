export function calculatePaperPerformance(ledgerEntries, paperExits) {
  assertSafeRecords(ledgerEntries, "ledger entry");
  assertSafeRecords(paperExits, "paper exit");

  const recordedLedgerEntries = ledgerEntries.filter((entry) => entry.ledger_event_type === "paper_entry_recorded");
  const rejectedLedgerEntries = ledgerEntries.filter((entry) => entry.ledger_event_type === "paper_entry_rejected");
  const recordedExits = paperExits.filter((exit) => exit.exit_event_type === "paper_exit_recorded");
  const rejectedExits = paperExits.filter((exit) => exit.exit_event_type === "paper_exit_rejected");
  const closedEntryIds = new Set(recordedExits.map((exit) => exit.source_paper_ledger_entry_id));

  return {
    total_paper_entries: recordedLedgerEntries.length,
    total_paper_exits: recordedExits.length,
    open_paper_entries: recordedLedgerEntries.length - closedEntryIds.size,
    closed_paper_entries: closedEntryIds.size,
    rejected_paper_entries: rejectedLedgerEntries.length,
    rejected_paper_exits: rejectedExits.length,
    total_entry_notional_cents: sum(recordedLedgerEntries, "notional_cents"),
    total_exit_notional_cents: sum(recordedExits, "exit_notional_cents"),
    total_gross_pnl_cents: sum(recordedExits, "gross_pnl_cents"),
    total_estimated_fees_cents: sum(recordedExits, "estimated_fee_cents"),
    total_net_pnl_cents: sum(recordedExits, "net_pnl_cents"),
    winning_paper_exits: recordedExits.filter((exit) => exit.net_pnl_cents > 0).length,
    losing_paper_exits: recordedExits.filter((exit) => exit.net_pnl_cents < 0).length,
    flat_paper_exits: recordedExits.filter((exit) => exit.net_pnl_cents === 0).length
  };
}

function assertSafeRecords(records, label) {
  for (const record of records) {
    if (record.paper_only !== true) {
      throw new Error(`${label} paper_only must be true`);
    }
    if (record.live_execution_allowed !== false) {
      throw new Error(`${label} live_execution_allowed must be false`);
    }
    if (record.order_placement_allowed !== false) {
      throw new Error(`${label} order_placement_allowed must be false`);
    }
  }
}

function sum(records, field) {
  return records.reduce((total, record) => total + record[field], 0);
}
