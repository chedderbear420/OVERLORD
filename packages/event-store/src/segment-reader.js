import { readJsonl } from "./jsonl.js";

export async function readSegment(segmentPath) {
  const records = await readJsonl(segmentPath);

  return records.map((record) => record.value);
}

export async function readSegmentRecords(segmentPath) {
  return readJsonl(segmentPath);
}
