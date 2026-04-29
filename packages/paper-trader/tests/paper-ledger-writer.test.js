import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { readJsonl } from "../../event-store/src/jsonl.js";
import { readPaperLedger } from "../src/paper-ledger-reader.js";
import { appendPaperLedgerEntries, createPaperLedgerFile } from "../src/paper-ledger-writer.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "paper-trader", "fixtures", "synthetic_paper_ledger_entries.jsonl");

test("createPaperLedgerFile refuses overwrite", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "overlord-paper-ledger-"));
  try {
    const ledgerPath = path.join(dir, "ledger.jsonl");
    await createPaperLedgerFile(ledgerPath);
    await assert.rejects(() => createPaperLedgerFile(ledgerPath), /EEXIST/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("appendPaperLedgerEntries appends validated entries and reader preserves order", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "overlord-paper-ledger-"));
  try {
    const ledgerPath = path.join(dir, "ledger.jsonl");
    const [entry] = (await readJsonl(fixturePath)).map((record) => record.value);
    const result = await appendPaperLedgerEntries({ ledgerPath, entries: [entry] });
    const entries = await readPaperLedger(ledgerPath);

    assert.equal(result.ok, true);
    assert.equal(result.appended, 1);
    assert.deepEqual(entries, [entry]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("appendPaperLedgerEntries rejects invalid entries before writing", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "overlord-paper-ledger-"));
  try {
    const ledgerPath = path.join(dir, "ledger.jsonl");
    const [entry] = (await readJsonl(fixturePath)).map((record) => record.value);
    const invalid = { ...entry, paper_ledger_entry_id: "bad_id" };
    const result = await appendPaperLedgerEntries({ ledgerPath, entries: [invalid] });

    assert.equal(result.ok, false);
    await assert.rejects(() => readFile(ledgerPath, "utf8"), /ENOENT/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("readPaperLedger fails cleanly on malformed JSONL", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "overlord-paper-ledger-"));
  try {
    const ledgerPath = path.join(dir, "ledger.jsonl");
    await writeFile(ledgerPath, "{\"bad\": true\n", "utf8");
    await assert.rejects(() => readPaperLedger(ledgerPath), /Invalid JSONL/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
