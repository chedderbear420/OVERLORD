import { kalshiPaperLedgerEntryId } from "./kalshi-paper-ledger-entry-id.js";

// Approved ledger modes for Phase 4P.
export const APPROVED_LEDGER_MODES = new Set(["local_fixture_paper_only"]);

// Approved paper accounting modes for Phase 4P.
export const APPROVED_PAPER_ACCOUNTING_MODES = new Set(["one_contract_unit_observation"]);

// Approved paper contract sides for Phase 4P.
export const APPROVED_PAPER_CONTRACT_SIDES = new Set(["yes_contract"]);

// Approved paper settlement statuses for Phase 4P.
export const APPROVED_PAPER_SETTLEMENT_STATUSES = new Set(["unsettled_fixture"]);

// Approved paper entry statuses for Phase 4P.
export const APPROVED_PAPER_ENTRY_STATUSES = new Set(["recorded_paper_observation"]);

// Approved paper outcome statuses for Phase 4P.
export const APPROVED_PAPER_OUTCOME_STATUSES = new Set(["open_unsettled"]);

// Approved condition families for Phase 4P (mirrors Phase 4N/4O).
export const APPROVED_CONDITION_FAMILIES = new Set(["descriptive_market_movement"]);

// Default options used when building the synthetic fixture.
export const defaultLedgerOptions = {
  ledgerMode: "local_fixture_paper_only",
  generatedAt: "2026-05-11T00:00:00Z",
  paperAccountingMode: "one_contract_unit_observation",
  paperContractSide: "yes_contract",
  paperFeeCents: 0,
  paperMarkPriceCents: null, // null = use last_price_cents from snapshot
};

/**
 * Build a canonical KalshiPaperLedgerEntry.
 *
 * Contract:
 * - No file I/O.
 * - No network requests.
 * - No environment variables.
 * - No credentials.
 * - All safety flags hardcoded.
 * - Non-actionable: does not emit signals, recommendations, decisions, orders,
 *   paper ledger entries, or live positions.
 * - Paper accounting only — one contract unit, unsettled fixture, no live execution.
 * - Records hypothetical economics from a Phase 4O signal evaluation summary
 *   and Phase 4M market snapshot.
 *
 * Net PnL formula: paper_net_pnl_cents = paper_unrealized_pnl_cents - paper_fees_cents
 * (fees are subtracted — a positive fee reduces net PnL).
 *
 * @param {object} signalEvaluationSummaryFixture  A KalshiSignalEvaluationSummary (Phase 4O).
 * @param {object} marketSnapshotFixture           A KalshiMarketSnapshot (Phase 4M).
 * @param {object} opts                            Override defaults for testing.
 * @returns {object}  KalshiPaperLedgerEntry
 */
export function buildKalshiPaperLedgerEntry(
  signalEvaluationSummaryFixture,
  marketSnapshotFixture,
  opts = {}
) {
  const options = {
    ...defaultLedgerOptions,
    ...opts,
  };

  const signalEvaluationSummaryId =
    signalEvaluationSummaryFixture.kalshi_signal_evaluation_summary_id;
  const marketSnapshotId = marketSnapshotFixture.kalshi_market_snapshot_id;

  const id = kalshiPaperLedgerEntryId({
    signalEvaluationSummaryId,
    marketSnapshotId,
    ledgerMode: options.ledgerMode,
    schemaVersion: "kalshi_paper_ledger_entry.v1",
    paperAccountingMode: options.paperAccountingMode,
    paperContractSide: options.paperContractSide,
  });

  const paper_entry_price_cents = marketSnapshotFixture.last_price_cents;
  const paper_mark_price_cents =
    options.paperMarkPriceCents ?? marketSnapshotFixture.last_price_cents;
  const paper_unrealized_pnl_cents = paper_mark_price_cents - paper_entry_price_cents;
  const paper_realized_pnl_cents = null; // Phase 4P: always unsettled_fixture
  const paper_fees_cents = options.paperFeeCents;
  // Net PnL = unrealized minus fees (fees subtract from net).
  const paper_net_pnl_cents = paper_unrealized_pnl_cents - paper_fees_cents;

  return {
    kalshi_paper_ledger_entry_id: id,
    schema_version: "kalshi_paper_ledger_entry.v1",
    generated_at: options.generatedAt,
    source_phase: "Phase 4P",
    ledger_mode: options.ledgerMode,
    paper_accounting_mode: options.paperAccountingMode,
    paper_contract_side: options.paperContractSide,

    // Source lineage.
    signal_evaluation_summary_id: signalEvaluationSummaryId,
    signal_evaluation_summary_schema_version: "kalshi_signal_evaluation_summary.v1",
    market_snapshot_id: marketSnapshotId,
    market_snapshot_schema_version: "kalshi_market_snapshot.v1",

    input_artifact_refs: {
      signal_evaluation_summary: {
        artifact_id: signalEvaluationSummaryId,
        schema_version: "kalshi_signal_evaluation_summary.v1",
      },
      market_snapshot: {
        artifact_id: marketSnapshotId,
        schema_version: "kalshi_market_snapshot.v1",
      },
    },

    // Market context — pulled directly from snapshot and signal definition lineage.
    market_ticker: marketSnapshotFixture.market_ticker,
    event_ticker: marketSnapshotFixture.event_ticker,
    condition_family: signalEvaluationSummaryFixture.condition_family,

    // Paper economics — one contract unit, unsettled fixture observation.
    paper_units: 1,
    paper_entry_price_cents,
    paper_mark_price_cents,
    paper_unrealized_pnl_cents,
    paper_realized_pnl_cents,
    paper_fees_cents,
    paper_net_pnl_cents,
    paper_settlement_status: "unsettled_fixture",
    paper_entry_status: "recorded_paper_observation",
    paper_outcome_status: "open_unsettled",

    research_notes: {
      source_evaluation_status: "evaluated_non_actionable",
      ledger_entry_scope: "paper_only_observation",
      runtime_reference: "none",
    },

    // Safety flags — hardcoded, never sourced from input.
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    credentials_used: false,
    network_request_used: false,

    // Emit flags — all false. Phase 4P emits nothing.
    emits_signal_events: false,
    emits_recommendations: false,
    emits_decisions: false,
    emits_orders: false,
    emits_live_positions: false,
    emits_paper_ledger_entries: false,

    reason_code: "PAPER_LEDGER_ENTRY_RECORDED",
    reason: "paper ledger entry recorded from local fixture",
  };
}
