import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { formatMarketStateValidationReport, validateMarketStateFile } from "../src/validate-market-states.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const fixturePath = path.join(
  repoRoot,
  "packages",
  "market-state-engine",
  "fixtures",
  "synthetic_market_states.jsonl"
);

test("positive MarketState fixture validates", async () => {
  const report = await validateMarketStateFile({ filePath: fixturePath });

  assert.equal(report.ok, true);
  assert.equal(report.records, 2);
  assert.deepEqual(report.errors, []);
});

test("MarketState validation report is deterministic", async () => {
  const report = await validateMarketStateFile({ filePath: fixturePath });
  const text = formatMarketStateValidationReport(report);

  assert.match(text, /Overlord MarketState Validation/);
  assert.match(text, /status: PASS/);
  assert.match(text, /errors: 0/);
});
