import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateStrategyDryRunEvidenceBundle,
  validateStrategyDryRunEvidenceBundleFile
} from "../src/validate-strategy-dry-run-evidence-bundle.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_strategy_dry_run_evidence_bundle.json");

test("synthetic StrategyDryRunEvidenceBundle fixture validates", async () => {
  const report = await validateStrategyDryRunEvidenceBundleFile({ filePath: fixturePath, repoRoot });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("StrategyDryRunEvidenceBundle validator rejects unsafe flags, bad ids, and bad counts", async () => {
  const bundle = await loadBundle();
  const report = await validateStrategyDryRunEvidenceBundle({
    ...bundle,
    strategy_dry_run_evidence_bundle_id: "bad",
    order_placement_allowed: true,
    evidence_artifacts: bundle.evidence_artifacts.map((artifact) => artifact.artifact_type === "strategy_dry_run_trace"
      ? { ...artifact, record_count: 99 }
      : artifact)
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /strategy_dry_run_evidence_bundle_id must be deterministic/);
  assert.match(report.errors.join("\n"), /order_placement_allowed must be false/);
  assert.match(report.errors.join("\n"), /record_count must match local fixture count/);
});

test("StrategyDryRunEvidenceBundle validator rejects failed ready checks and forbidden fields", async () => {
  const bundle = await loadBundle();
  const report = await validateStrategyDryRunEvidenceBundle({
    ...bundle,
    consistency_checks: bundle.consistency_checks.map((check, index) => index === 0 ? { ...check, status: "check_failed" } : check),
    order_request: { status: "blocked" }
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /ready dry-run evidence bundles must not contain failed consistency checks/);
  assert.match(report.errors.join("\n"), /forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field/);
});

async function loadBundle() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
