import { readJsonl } from "../../event-store/src/jsonl.js";
import { buildMarketStatesFromEnvelopes } from "./build-market-state.js";

export async function readMarketStateJsonl(filePath) {
  const records = await readJsonl(filePath);
  return records.map((record) => record.value);
}

export async function buildMarketStatesFromEventFixture(filePath, options = {}) {
  const records = await readJsonl(filePath);
  return buildMarketStatesFromEnvelopes(records.map((record) => record.value), options);
}
