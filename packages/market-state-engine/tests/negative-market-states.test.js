import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validateMarketStateFile } from "../src/validate-market-states.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "market-state-engine", "fixtures", "negative");

const cases = [
  {
    file: "malformed_market_state_jsonl.jsonl",
    expected: "Invalid JSONL at line 1"
  },
  {
    file: "missing_provenance.jsonl",
    expected: "source_payload_hash is required"
  },
  {
    file: "missing_normalized_fields.jsonl",
    expected: "no_mid is required"
  },
  {
    file: "bad_price_bounds.jsonl",
    expected: "best_yes_bid must be an integer cent value from 0 to 100 or null"
  },
  {
    file: "bad_spread_math.jsonl",
    expected: "yes_spread must equal best_yes_ask - best_yes_bid"
  },
  {
    file: "bad_state_id.jsonl",
    expected: "state_id must equal ms_<source_event_id>"
  },
  {
    file: "non_monotonic_replay_clock.jsonl",
    expected: "received_at must be monotonic for replay fixture order"
  }
];

for (const item of cases) {
  test(`${item.file} fails with expected MarketState validation message`, async () => {
    const report = await validateMarketStateFile({
      filePath: path.join(negativeDir, item.file)
    });

    assert.equal(report.ok, false);
    assert.match(report.errors.join("\n"), new RegExp(escapeRegExp(item.expected)));
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
