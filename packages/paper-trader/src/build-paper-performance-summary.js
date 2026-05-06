import path from "node:path";
import { readJsonl } from "../../event-store/src/jsonl.js";
import { paperPerformanceSummaryId } from "./paper-performance-summary-id.js";
import { calculatePaperPerformance } from "./paper-performance-math.js";
import { validatePaperLedgerRecords } from "./validate-paper-ledger.js";
import { validatePaperExitRecords } from "./validate-paper-exits.js";

export async function buildPaperPerformanceSummaryFromFixtures(options) {
  const ledgerPath = options.ledgerPath;
  const exitPath = options.exitPath;
  const generatedAt = options.generatedAt;
  const ledgerRecords = await readJsonl(ledgerPath);
  const exitRecords = await readJsonl(exitPath);
  const ledgerValidation = validatePaperLedgerRecords(ledgerRecords);
  const exitValidation = validatePaperExitRecords(exitRecords);

  if (!ledgerValidation.ok) {
    throw new Error(`PaperLedger fixture validation failed: ${ledgerValidation.errors.join("; ")}`);
  }
  if (!exitValidation.ok) {
    throw new Error(`PaperExit fixture validation failed: ${exitValidation.errors.join("; ")}`);
  }

  return buildPaperPerformanceSummary({
    ledgerEntries: ledgerRecords.map((record) => record.value),
    paperExits: exitRecords.map((record) => record.value),
    sourceLedgerFixture: normalizeFixturePath(ledgerPath),
    sourceExitFixture: normalizeFixturePath(exitPath),
    generatedAt
  });
}

export function buildPaperPerformanceSummary(options) {
  const generatedAt = options.generatedAt;
  validateGeneratedAt(generatedAt);
  const ledgerEntries = options.ledgerEntries ?? [];
  const paperExits = options.paperExits ?? [];
  const accounting = calculatePaperPerformance(ledgerEntries, paperExits);
  const sourceLedgerFixture = options.sourceLedgerFixture;
  const sourceExitFixture = options.sourceExitFixture;

  return {
    paper_performance_summary_id: paperPerformanceSummaryId(sourceLedgerFixture, sourceExitFixture, generatedAt),
    schema_version: "paper_performance_summary.v1",
    source_ledger_fixture: sourceLedgerFixture,
    source_exit_fixture: sourceExitFixture,
    ledger_record_count: ledgerEntries.length,
    exit_record_count: paperExits.length,
    generated_at: generatedAt,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    summary_type: "paper_accounting_summary",
    ...accounting,
    status: "summary_ready",
    reason: "Read-only fake-accounting summary generated from local paper ledger and paper exit fixtures."
  };
}

function validateGeneratedAt(generatedAt) {
  if (Number.isNaN(Date.parse(generatedAt))) {
    throw new Error("generated_at must be a valid timestamp");
  }
}

function normalizeFixturePath(filePath) {
  return path.relative(path.resolve(import.meta.dirname, "..", "..", ".."), filePath).replaceAll("\\", "/");
}
