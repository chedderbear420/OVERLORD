import { readJsonl } from "../../event-store/src/jsonl.js";

export async function readPaperLedger(ledgerPath) {
  const records = await readPaperLedgerRecords(ledgerPath);
  return records.map((record) => record.value);
}

export async function readPaperLedgerRecords(ledgerPath) {
  return readJsonl(ledgerPath);
}
