import { createHash } from "node:crypto";

/**
 * Compute a deterministic, content-addressed ID for a KalshiPaperLedgerEntry.
 *
 * @param {object} params
 * @param {string} params.signalEvaluationSummaryId  kses_-prefixed Phase 4O summary ID
 * @param {string} params.marketSnapshotId           kms_-prefixed Phase 4M snapshot ID
 * @param {string} params.ledgerMode                 e.g. "local_fixture_paper_only"
 * @param {string} params.schemaVersion              e.g. "kalshi_paper_ledger_entry.v1"
 * @param {string} params.paperAccountingMode        e.g. "one_contract_unit_observation"
 * @param {string} params.paperContractSide          e.g. "yes_contract"
 * @returns {string}  "kple_" + first 32 hex chars of SHA-256
 */
export function kalshiPaperLedgerEntryId({
  signalEvaluationSummaryId,
  marketSnapshotId,
  ledgerMode,
  schemaVersion,
  paperAccountingMode,
  paperContractSide,
}) {
  const digest = createHash("sha256")
    .update(
      [
        signalEvaluationSummaryId,
        marketSnapshotId,
        ledgerMode,
        schemaVersion,
        paperAccountingMode,
        paperContractSide,
      ].join("|")
    )
    .digest("hex")
    .slice(0, 32);
  return `kple_${digest}`;
}
