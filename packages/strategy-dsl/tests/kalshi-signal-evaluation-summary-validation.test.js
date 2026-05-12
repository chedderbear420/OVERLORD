import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  validateKalshiSignalEvaluationSummary,
  validateKalshiSignalEvaluationSummaryFile,
} from "../src/validate-kalshi-signal-evaluation-summary.js";
import { buildKalshiSignalEvaluationSummary } from "../src/build-kalshi-signal-evaluation-summary.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(
  repoRoot,
  "packages",
  "strategy-dsl",
  "fixtures",
  "synthetic_kalshi_signal_evaluation_summary.json"
);

async function loadFixture() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}

// 1. Synthetic fixture validates
test("synthetic KalshiSignalEvaluationSummary fixture validates", async () => {
  const report = await validateKalshiSignalEvaluationSummaryFile({ filePath: fixturePath });
  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

// 2. Unknown fields are rejected
test("unknown fields are rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({ ...summary, unexpected_hook: "value" });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /ERR_UNKNOWN_FIELD/);
});

// 3. Non-deterministic ID is rejected
test("non-deterministic ID is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    kalshi_signal_evaluation_summary_id: "kses_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /deterministic/);
});

// 4. Wrong schema_version is rejected
test("wrong schema_version is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    schema_version: "kalshi_signal_evaluation_summary.v2",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /schema_version must be kalshi_signal_evaluation_summary\.v1/);
});

// 5. Wrong evaluation_mode is rejected
test("wrong evaluation_mode is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    evaluation_mode: "live_execution",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /evaluation_mode must be local_fixture_evaluation_only/);
});

// 6. Wrong evaluation_phase is rejected
test("wrong evaluation_phase is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    evaluation_phase: "Phase 4N",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /evaluation_phase must be Phase 4O/);
});

// 7. Wrong condition_family is rejected
test("unapproved condition_family is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    condition_family: "momentum_trading",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /condition_family must be one of/);
});

// 8. Wrong evaluation_status is rejected
test("wrong evaluation_status is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    evaluation_status: "actionable_signal",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /evaluation_status must be evaluated_non_actionable/);
});

// 9. paper_only false is rejected
test("paper_only false is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({ ...summary, paper_only: false });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /paper_only must be true/);
});

// 10. live_execution_allowed true is rejected
test("live_execution_allowed true is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({ ...summary, live_execution_allowed: true });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /live_execution_allowed must be false/);
});

// 11. order_placement_allowed true is rejected
test("order_placement_allowed true is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({ ...summary, order_placement_allowed: true });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /order_placement_allowed must be false/);
});

// 12. credentials_used true is rejected
test("credentials_used true is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({ ...summary, credentials_used: true });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /credentials_used must be false/);
});

// 13. network_request_used true is rejected
test("network_request_used true is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({ ...summary, network_request_used: true });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /network_request_used must be false/);
});

// 14. actionable true is rejected
test("actionable true is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({ ...summary, actionable: true });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /actionable must be false/);
});

// 15. signal_emitted true is rejected
test("signal_emitted true is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({ ...summary, signal_emitted: true });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /signal_emitted must be false/);
});

// 16. Wrong reason_code is rejected
test("wrong reason_code is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    reason_code: "EMIT_SIGNAL_NOW",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /reason_code must be EVALUATION_COMPLETE_NON_ACTIONABLE/);
});

// 17. evaluated_thresholds not array is rejected
test("evaluated_thresholds not array is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({ ...summary, evaluated_thresholds: null });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /evaluated_thresholds must be an array/);
});

// 18. evaluated_thresholds empty array is rejected
test("evaluated_thresholds empty array is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({ ...summary, evaluated_thresholds: [] });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /evaluated_thresholds must have at least one entry/);
});

// 19. evaluated_thresholds item missing passed is rejected
test("evaluated_thresholds item missing passed field is rejected", async () => {
  const summary = await loadFixture();
  const badThresholds = summary.evaluated_thresholds.map((t, i) =>
    i === 0 ? { ...t, passed: undefined } : t
  );
  // Drop the key entirely
  const { passed: _unused, ...noPassedEntry } = summary.evaluated_thresholds[0];
  const withMissingPassed = {
    ...summary,
    evaluated_thresholds: [noPassedEntry, ...summary.evaluated_thresholds.slice(1)],
  };
  const result = validateKalshiSignalEvaluationSummary(withMissingPassed);
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /passed/);
});

// 20. evaluated_thresholds item with non-boolean passed is rejected
test("evaluated_thresholds item with non-boolean passed is rejected", async () => {
  const summary = await loadFixture();
  const withBadPassed = {
    ...summary,
    evaluated_thresholds: [
      { ...summary.evaluated_thresholds[0], passed: "yes" },
      ...summary.evaluated_thresholds.slice(1),
    ],
  };
  const result = validateKalshiSignalEvaluationSummary(withBadPassed);
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /passed must be a boolean/);
});

// 21. research_summary thresholds_passed_count mismatch is rejected
test("research_summary thresholds_passed_count mismatch is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    research_summary: { ...summary.research_summary, thresholds_passed_count: 0 },
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /thresholds_passed_count/);
});

// 22. research_summary evaluation_complete mismatch is rejected
test("research_summary evaluation_complete mismatch is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    research_summary: { ...summary.research_summary, evaluation_complete: false },
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /evaluation_complete/);
});

// 23. Forbidden field names recursively rejected
test("forbidden field names are recursively rejected", async () => {
  const summary = await loadFixture();
  const withOrder = validateKalshiSignalEvaluationSummary({ ...summary, order: { side: "yes" } });
  assert.equal(withOrder.ok, false);
  assert.match(withOrder.errors.join("\n"), /forbidden evaluation summary field/);

  const withNested = validateKalshiSignalEvaluationSummary({
    ...summary,
    metadata: { api_key: "secret" },
  });
  assert.equal(withNested.ok, false);
  assert.match(withNested.errors.join("\n"), /forbidden evaluation summary field/);
});

// 24. Forbidden string value in reason is rejected
test("forbidden string value in reason is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    reason: "ready to place order now",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /forbidden evaluation summary string value/);
});

// 25. reason "generate trading signal" is rejected
test('reason "generate trading signal" is rejected', async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    reason: "generate trading signal for this market",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /forbidden evaluation summary string value/);
});

// 26. Wrong signal_definition_id prefix is rejected
test("signal_definition_id with wrong prefix is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    signal_definition_id: "kms_a64e39e9a580e9065a5ecbef7baea712",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /signal_definition_id must be a kssd_-prefixed/);
});

// 27. Wrong market_snapshot_id prefix is rejected
test("market_snapshot_id with wrong prefix is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    market_snapshot_id: "kssd_632d07fb70d0027b0656993db9586134",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /market_snapshot_id must be a kms_-prefixed/);
});

// 28. Builder output validates cleanly with custom threshold values
test("builder output with failing thresholds validates when counts are consistent", async () => {
  const repoRoot2 = path.resolve(import.meta.dirname, "..", "..", "..");
  const defFixture = JSON.parse(
    await readFile(
      path.join(repoRoot2, "packages", "strategy-dsl", "fixtures", "synthetic_kalshi_strategy_signal_definition.json"),
      "utf8"
    )
  );
  const snapFixture = JSON.parse(
    await readFile(
      path.join(repoRoot2, "packages", "strategy-dsl", "fixtures", "synthetic_kalshi_market_snapshot.json"),
      "utf8"
    )
  );

  // Use a very tight spread threshold so spread=2 fails against threshold=1
  const built = buildKalshiSignalEvaluationSummary(defFixture, snapFixture, {
    thresholdValues: { max_spread_cents: 1, min_volume: 1000, min_open_interest: 500, max_snapshot_age_seconds: 300 },
  });

  // The builder produces correct counts — the validator should accept it
  assert.equal(built.research_summary.thresholds_failed_count, 1);
  assert.equal(built.research_summary.evaluation_complete, false);

  const result = validateKalshiSignalEvaluationSummary(built);
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});
