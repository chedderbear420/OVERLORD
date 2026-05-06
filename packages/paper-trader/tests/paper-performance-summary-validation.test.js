import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { validatePaperPerformanceSummary, validatePaperPerformanceSummaryFile } from "../src/validate-paper-performance-summary.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const summaryFixturePath = path.join(repoRoot, "packages", "paper-trader", "fixtures", "synthetic_paper_performance_summary.json");

test("synthetic PaperPerformanceSummary fixture validates", async () => {
  const report = await validatePaperPerformanceSummaryFile({ filePath: summaryFixturePath });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("PaperPerformanceSummary validator rejects unsafe flags and bad ids", async () => {
  const summary = JSON.parse(await readFile(summaryFixturePath, "utf8"));
  const report = validatePaperPerformanceSummary({
    ...summary,
    paper_performance_summary_id: "bad_id",
    live_execution_allowed: true
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /paper_performance_summary_id must be deterministic/);
  assert.match(report.errors.join("\n"), /live_execution_allowed must be false/);
});

test("PaperPerformanceSummary validator rejects inconsistent summary math", async () => {
  const summary = JSON.parse(await readFile(summaryFixturePath, "utf8"));
  const report = validatePaperPerformanceSummary({
    ...summary,
    open_paper_entries: 1,
    winning_paper_exits: 0
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /open_paper_entries must equal/);
  assert.match(report.errors.join("\n"), /exit outcome counts must sum/);
});
