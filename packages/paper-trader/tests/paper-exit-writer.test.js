import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { readJsonl } from "../../event-store/src/jsonl.js";
import { readPaperExits } from "../src/paper-exit-reader.js";
import { appendPaperExits, createPaperExitFile } from "../src/paper-exit-writer.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "paper-trader", "fixtures", "synthetic_paper_exits.jsonl");

test("createPaperExitFile refuses overwrite", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "overlord-paper-exit-"));
  try {
    const exitPath = path.join(dir, "exits.jsonl");
    await createPaperExitFile(exitPath);
    await assert.rejects(() => createPaperExitFile(exitPath), /EEXIST/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("appendPaperExits appends validated exits and reader preserves order", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "overlord-paper-exit-"));
  try {
    const exitPath = path.join(dir, "exits.jsonl");
    const [exit] = (await readJsonl(fixturePath)).map((record) => record.value);
    const result = await appendPaperExits({ exitPath, exits: [exit] });
    const exits = await readPaperExits(exitPath);

    assert.equal(result.ok, true);
    assert.equal(result.appended, 1);
    assert.deepEqual(exits, [exit]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("appendPaperExits rejects invalid exits before writing", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "overlord-paper-exit-"));
  try {
    const exitPath = path.join(dir, "exits.jsonl");
    const [exit] = (await readJsonl(fixturePath)).map((record) => record.value);
    const invalid = { ...exit, paper_exit_id: "bad_id" };
    const result = await appendPaperExits({ exitPath, exits: [invalid] });

    assert.equal(result.ok, false);
    await assert.rejects(() => readFile(exitPath, "utf8"), /ENOENT/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("readPaperExits fails cleanly on malformed JSONL", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "overlord-paper-exit-"));
  try {
    const exitPath = path.join(dir, "exits.jsonl");
    await writeFile(exitPath, "{\"bad\": true\n", "utf8");
    await assert.rejects(() => readPaperExits(exitPath), /Invalid JSONL/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
