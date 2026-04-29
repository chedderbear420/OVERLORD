import { mkdir, open, stat } from "node:fs/promises";
import path from "node:path";
import { readPaperLedgerRecords } from "./paper-ledger-reader.js";
import { validatePaperLedgerRecords } from "./validate-paper-ledger.js";

export async function createPaperLedgerFile(ledgerPath) {
  await mkdir(path.dirname(ledgerPath), { recursive: true });
  const file = await open(ledgerPath, "wx");
  await file.close();
  return ledgerPath;
}

export async function appendPaperLedgerEntries(options) {
  const ledgerPath = options.ledgerPath;
  const entries = options.entries ?? [];
  const existingRecords = await readExistingRecords(ledgerPath);
  const candidateRecords = entries.map((entry, index) => ({
    lineNumber: existingRecords.length + index + 1,
    value: entry
  }));
  const validation = validatePaperLedgerRecords([...existingRecords, ...candidateRecords]);

  if (!validation.ok) {
    return {
      ok: false,
      appended: 0,
      errors: validation.errors
    };
  }

  await mkdir(path.dirname(ledgerPath), { recursive: true });
  const file = await open(ledgerPath, "a");
  try {
    for (const entry of entries) {
      await file.write(`${JSON.stringify(entry)}\n`);
    }
  } finally {
    await file.close();
  }

  return {
    ok: true,
    appended: entries.length,
    errors: []
  };
}

async function readExistingRecords(ledgerPath) {
  try {
    await stat(ledgerPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  return readPaperLedgerRecords(ledgerPath);
}
