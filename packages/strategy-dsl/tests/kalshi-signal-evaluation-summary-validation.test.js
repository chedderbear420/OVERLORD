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

async function loadSourceFixtures() {
  const defFixture = JSON.parse(
    await readFile(
      path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_kalshi_strategy_signal_definition.json"),
      "utf8"
    )
  );
  const snapFixture = JSON.parse(
    await readFile(
      path.join(repoRoot, "packages", "strategy-dsl", "fixtures", "synthetic_kalshi_market_snapshot.json"),
      "utf8"
    )
  );
  return { defFixture, snapFixture };
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

// 6. Wrong source_phase is rejected
test("wrong source_phase is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    source_phase: "Phase 4N",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /source_phase must be Phase 4O/);
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

// 14. emits_signal_events true is rejected
test("emits_signal_events true is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({ ...summary, emits_signal_events: true });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /emits_signal_events must be false/);
});

// 15. emits_recommendations true is rejected
test("emits_recommendations true is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({ ...summary, emits_recommendations: true });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /emits_recommendations must be false/);
});

// 16. emits_decisions true is rejected
test("emits_decisions true is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({ ...summary, emits_decisions: true });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /emits_decisions must be false/);
});

// 17. emits_orders true is rejected
test("emits_orders true is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({ ...summary, emits_orders: true });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /emits_orders must be false/);
});

// 18. emits_paper_ledger_entries true is rejected
test("emits_paper_ledger_entries true is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({ ...summary, emits_paper_ledger_entries: true });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /emits_paper_ledger_entries must be false/);
});

// 19. Wrong reason_code is rejected
test("wrong reason_code is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    reason_code: "EMIT_SIGNAL_NOW",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /reason_code must be EVALUATION_COMPLETE_NON_ACTIONABLE/);
});

// 20. Wrong signal_definition_schema_version is rejected
test("wrong signal_definition_schema_version is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    signal_definition_schema_version: "kalshi_strategy_signal_definition.v2",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /signal_definition_schema_version must be kalshi_strategy_signal_definition\.v1/);
});

// 21. Wrong market_snapshot_schema_version is rejected
test("wrong market_snapshot_schema_version is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    market_snapshot_schema_version: "kalshi_market_snapshot.v2",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /market_snapshot_schema_version must be kalshi_market_snapshot\.v1/);
});

// 22. input_artifact_refs signal_definition artifact_id mismatch is rejected
test("input_artifact_refs signal_definition artifact_id mismatch is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    input_artifact_refs: {
      ...summary.input_artifact_refs,
      signal_definition: {
        ...summary.input_artifact_refs.signal_definition,
        artifact_id: "kssd_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      },
    },
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /signal_definition\.artifact_id must match signal_definition_id/);
});

// 23. input_artifact_refs market_snapshot artifact_id mismatch is rejected
test("input_artifact_refs market_snapshot artifact_id mismatch is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    input_artifact_refs: {
      ...summary.input_artifact_refs,
      market_snapshot: {
        ...summary.input_artifact_refs.market_snapshot,
        artifact_id: "kms_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      },
    },
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /market_snapshot\.artifact_id must match market_snapshot_id/);
});

// 24. evaluated_thresholds not array is rejected
test("evaluated_thresholds not array is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({ ...summary, evaluated_thresholds: null });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /evaluated_thresholds must be an array/);
});

// 25. evaluated_thresholds empty array is rejected
test("evaluated_thresholds empty array is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({ ...summary, evaluated_thresholds: [] });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /evaluated_thresholds must have at least one entry/);
});

// 26. Threshold status other than "evaluated" is rejected
test('threshold status other than "evaluated" is rejected', async () => {
  const summary = await loadFixture();
  const withBadStatus = {
    ...summary,
    evaluated_thresholds: [
      { ...summary.evaluated_thresholds[0], status: "pending" },
      ...summary.evaluated_thresholds.slice(1),
    ],
  };
  const result = validateKalshiSignalEvaluationSummary(withBadStatus);
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /status must be "evaluated"/);
});

// 27. Unsafe data_source_field is rejected
test("unapproved data_source_field is rejected", async () => {
  const summary = await loadFixture();
  const withBadField = {
    ...summary,
    evaluated_thresholds: [
      { ...summary.evaluated_thresholds[0], data_source_field: "api_key" },
      ...summary.evaluated_thresholds.slice(1),
    ],
  };
  const result = validateKalshiSignalEvaluationSummary(withBadField);
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /data_source_field.*is not an approved/);
});

// 28. evaluated_thresholds item missing passed field is rejected
test("evaluated_thresholds item missing passed field is rejected", async () => {
  const summary = await loadFixture();
  const { passed: _unused, ...noPassedEntry } = summary.evaluated_thresholds[0];
  const withMissingPassed = {
    ...summary,
    evaluated_thresholds: [noPassedEntry, ...summary.evaluated_thresholds.slice(1)],
  };
  const result = validateKalshiSignalEvaluationSummary(withMissingPassed);
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /passed/);
});

// 29. evaluated_thresholds item with non-boolean passed is rejected
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

// 30. data_quality_status other than "complete" is rejected
test('data_quality_status other than "complete" is rejected', async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    data_quality_status: "partial",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /data_quality_status must be complete/);
});

// 31. research_summary thresholds_passed_count mismatch is rejected
test("research_summary thresholds_passed_count mismatch is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    research_summary: { ...summary.research_summary, thresholds_passed_count: 0 },
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /thresholds_passed_count/);
});

// 32. research_summary evaluation_complete mismatch is rejected
test("research_summary evaluation_complete mismatch is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    research_summary: { ...summary.research_summary, evaluation_complete: false },
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /evaluation_complete/);
});

// 33. Forbidden field names recursively rejected
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

// 34. Forbidden string value in reason is rejected
test("forbidden string value in reason is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    reason: "ready to place order now",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /forbidden evaluation summary string value/);
});

// 35. reason "generate trading signal" is rejected
test('reason "generate trading signal" is rejected', async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    reason: "generate trading signal for this market",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /forbidden evaluation summary string value/);
});

// 36. wrong signal_definition_id prefix is rejected
test("signal_definition_id with wrong prefix is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    signal_definition_id: "kms_a64e39e9a580e9065a5ecbef7baea712",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /signal_definition_id must be a kssd_-prefixed/);
});

// 37. wrong market_snapshot_id prefix is rejected
test("market_snapshot_id with wrong prefix is rejected", async () => {
  const summary = await loadFixture();
  const result = validateKalshiSignalEvaluationSummary({
    ...summary,
    market_snapshot_id: "kssd_632d07fb70d0027b0656993db9586134",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /market_snapshot_id must be a kms_-prefixed/);
});

// 38. Builder output with failing thresholds validates when counts are consistent
test("builder output with failing thresholds validates when counts are consistent", async () => {
  const { defFixture, snapFixture } = await loadSourceFixtures();

  // Tight spread threshold so spread=2 fails against threshold=1
  const built = buildKalshiSignalEvaluationSummary(defFixture, snapFixture, {
    thresholdValues: { max_spread_cents: 1, min_volume: 1000, min_open_interest: 500, max_snapshot_age_seconds: 300 },
  });

  assert.equal(built.research_summary.thresholds_failed_count, 1);
  assert.equal(built.research_summary.evaluation_complete, false);

  const result = validateKalshiSignalEvaluationSummary(built);
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

// 39. Safe structural field names (signal_definition_id, emits_signal_events) pass validation
test("safe structural field names signal_definition_id and emits_signal_events pass when values are correct", async () => {
  const { defFixture, snapFixture } = await loadSourceFixtures();

  // Builder always sets these fields correctly. Verify the validator accepts them.
  const built = buildKalshiSignalEvaluationSummary(defFixture, snapFixture);

  // Structural field name check: signal_definition_id contains "signal" as substring
  // but is a required structural field, not a forbidden implementation field.
  assert.ok(built.signal_definition_id.startsWith("kssd_"), "signal_definition_id must be kssd_-prefixed");

  // emits_signal_events is an approved structural emit-guard field (value must be false).
  assert.equal(built.emits_signal_events, false);

  const result = validateKalshiSignalEvaluationSummary(built);
  assert.equal(result.ok, true, "structural fields with safe values must pass validation");
  assert.deepEqual(result.errors, []);
});
