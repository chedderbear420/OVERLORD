import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { buildPaperPerformanceSummaryFromFixtures } from "../src/build-paper-performance-summary.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const ledgerPath = path.join(repoRoot, "packages", "paper-trader", "fixtures", "synthetic_paper_ledger_entries.jsonl");
const exitPath = path.join(repoRoot, "packages", "paper-trader", "fixtures", "synthetic_paper_exits.jsonl");
const summaryFixturePath = path.join(repoRoot, "packages", "paper-trader", "fixtures", "synthetic_paper_performance_summary.json");

test("buildPaperPerformanceSummaryFromFixtures matches synthetic summary fixture", async () => {
  const generated = await buildPaperPerformanceSummaryFromFixtures({
    ledgerPath,
    exitPath,
    generatedAt: "2026-04-28T14:05:01Z"
  });
  const fixture = JSON.parse(await readFile(summaryFixturePath, "utf8"));

  assert.deepEqual(generated, fixture);
});

test("buildPaperPerformanceSummaryFromFixtures is read-only and deterministic", async () => {
  const first = await buildPaperPerformanceSummaryFromFixtures({
    ledgerPath,
    exitPath,
    generatedAt: "2026-04-28T14:05:01Z"
  });
  const second = await buildPaperPerformanceSummaryFromFixtures({
    ledgerPath,
    exitPath,
    generatedAt: "2026-04-28T14:05:01Z"
  });

  assert.deepEqual(first, second);
  assert.equal(first.paper_only, true);
  assert.equal(first.live_execution_allowed, false);
  assert.equal(first.order_placement_allowed, false);
});
