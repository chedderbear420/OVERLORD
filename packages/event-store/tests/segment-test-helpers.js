import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJsonl } from "../src/jsonl.js";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
export const positiveFixturePath = path.join(
  repoRoot,
  "packages",
  "event-store",
  "fixtures",
  "synthetic_market_events.jsonl"
);

export async function withTempDir(callback) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "overlord-event-store-"));
  try {
    return await callback(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function loadPositiveEnvelopes() {
  const records = await readJsonl(positiveFixturePath);
  return records.map((record) => record.value);
}

export async function readText(filePath) {
  return readFile(filePath, "utf8");
}

export async function writeText(filePath, text) {
  return writeFile(filePath, text, "utf8");
}
