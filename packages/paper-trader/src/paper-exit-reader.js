import { readJsonl } from "../../event-store/src/jsonl.js";

export async function readPaperExits(exitPath) {
  const records = await readPaperExitRecords(exitPath);
  return records.map((record) => record.value);
}

export async function readPaperExitRecords(exitPath) {
  return readJsonl(exitPath);
}
