import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  buildKalshiSignalEvaluationSummary,
  defaultEvaluationOptions,
} from "../src/build-kalshi-signal-evaluation-summary.js";
import { kalshiSignalEvaluationSummaryId } from "../src/kalshi-signal-evaluation-summary-id.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");

async function loadFixture(name) {
  const p = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", name);
  return JSON.parse(await readFile(p, "utf8"));
}

// 1. Builder output deepEquals the committed fixture
test("builder output deepEquals the committed synthetic fixture", async () => {
  const defFixture = await loadFixture("synthetic_kalshi_strategy_signal_definition.json");
  const snapFixture = await loadFixture("synthetic_kalshi_market_snapshot.json");
  const committedFixture = await loadFixture("synthetic_kalshi_signal_evaluation_summary.json");

  const built = buildKalshiSignalEvaluationSummary(defFixture, snapFixture);
  assert.deepEqual(built, committedFixture);
});

// 2. Builder ID matches kalshiSignalEvaluationSummaryId
test("builder ID matches kalshiSignalEvaluationSummaryId for given inputs", async () => {
  const defFixture = await loadFixture("synthetic_kalshi_strategy_signal_definition.json");
  const snapFixture = await loadFixture("synthetic_kalshi_market_snapshot.json");

  const built = buildKalshiSignalEvaluationSummary(defFixture, snapFixture);
  const expected = kalshiSignalEvaluationSummaryId({
    signalDefinitionId: defFixture.kalshi_strategy_signal_definition_id,
    marketSnapshotId: snapFixture.kalshi_market_snapshot_id,
    evaluationMode: defaultEvaluationOptions.evaluationMode,
    schemaVersion: "kalshi_signal_evaluation_summary.v1",
    conditionFamily: defFixture.condition_family,
  });
  assert.equal(built.kalshi_signal_evaluation_summary_id, expected);
  assert.match(built.kalshi_signal_evaluation_summary_id, /^kses_[a-f0-9]{32}$/u);
});

// 3. Builder computes spread from yes_ask_cents minus yes_bid_cents
test("builder computes yes_ask_cents_minus_yes_bid_cents from snapshot", async () => {
  const defFixture = await loadFixture("synthetic_kalshi_strategy_signal_definition.json");
  const snapFixture = await loadFixture("synthetic_kalshi_market_snapshot.json");

  const built = buildKalshiSignalEvaluationSummary(defFixture, snapFixture);
  const spreadEntry = built.evaluated_thresholds.find((t) => t.threshold_name === "max_spread_cents");
  assert.ok(spreadEntry, "max_spread_cents entry must exist");
  assert.equal(spreadEntry.observed_value, snapFixture.yes_ask_cents - snapFixture.yes_bid_cents);
  assert.equal(spreadEntry.data_source_field, "yes_ask_cents_minus_yes_bid_cents");
  assert.equal(spreadEntry.status, "evaluated");
});

// 4. Builder snapshot_age_seconds = 0 when evaluationTimestamp equals snapshot generated_at
test("builder computes snapshot_age_seconds = 0 when timestamps match", async () => {
  const defFixture = await loadFixture("synthetic_kalshi_strategy_signal_definition.json");
  const snapFixture = await loadFixture("synthetic_kalshi_market_snapshot.json");

  const built = buildKalshiSignalEvaluationSummary(defFixture, snapFixture);
  const ageEntry = built.evaluated_thresholds.find((t) => t.threshold_name === "max_snapshot_age_seconds");
  assert.ok(ageEntry, "max_snapshot_age_seconds entry must exist");
  assert.equal(ageEntry.observed_value, 0);
  assert.equal(ageEntry.data_source_field, "generated_at");
  assert.equal(ageEntry.status, "evaluated");
});

// 5. Builder with spread exceeding threshold produces passed=false
test("builder marks max_spread_cents as failed when observed spread exceeds threshold", async () => {
  const defFixture = await loadFixture("synthetic_kalshi_strategy_signal_definition.json");
  const wideSnap = {
    ...await loadFixture("synthetic_kalshi_market_snapshot.json"),
    yes_ask_cents: 60,
    yes_bid_cents: 40,   // spread = 20 > threshold 5
  };

  const built = buildKalshiSignalEvaluationSummary(defFixture, wideSnap, {
    thresholdValues: { max_spread_cents: 5 },
  });
  const spreadEntry = built.evaluated_thresholds.find((t) => t.threshold_name === "max_spread_cents");
  assert.equal(spreadEntry.observed_value, 20);
  assert.equal(spreadEntry.passed, false);
  assert.equal(built.research_summary.thresholds_failed_count, 1);
  assert.equal(built.research_summary.evaluation_complete, false);
});

// 6. Builder research_summary counts are always consistent
test("builder research_summary counts match evaluated_thresholds", async () => {
  const defFixture = await loadFixture("synthetic_kalshi_strategy_signal_definition.json");
  const snapFixture = await loadFixture("synthetic_kalshi_market_snapshot.json");

  const built = buildKalshiSignalEvaluationSummary(defFixture, snapFixture);
  const { thresholds_evaluated_count, thresholds_passed_count, thresholds_failed_count, evaluation_complete } =
    built.research_summary;
  assert.equal(thresholds_evaluated_count, built.evaluated_thresholds.length);
  assert.equal(thresholds_passed_count, built.evaluated_thresholds.filter((t) => t.passed).length);
  assert.equal(thresholds_failed_count, built.evaluated_thresholds.filter((t) => !t.passed).length);
  assert.equal(evaluation_complete, thresholds_failed_count === 0);
});

// 7. Builder safety and emit flags are hardcoded regardless of opts
test("builder safety and emit flags are hardcoded and cannot be overridden by opts", async () => {
  const defFixture = await loadFixture("synthetic_kalshi_strategy_signal_definition.json");
  const snapFixture = await loadFixture("synthetic_kalshi_market_snapshot.json");

  const built = buildKalshiSignalEvaluationSummary(defFixture, snapFixture, {
    paper_only: false,
    emits_signal_events: true,
    emits_orders: true,
  });
  assert.equal(built.paper_only, true);
  assert.equal(built.live_execution_allowed, false);
  assert.equal(built.order_placement_allowed, false);
  assert.equal(built.credentials_used, false);
  assert.equal(built.network_request_used, false);
  assert.equal(built.emits_signal_events, false);
  assert.equal(built.emits_recommendations, false);
  assert.equal(built.emits_decisions, false);
  assert.equal(built.emits_orders, false);
  assert.equal(built.emits_paper_ledger_entries, false);
  assert.equal(built.evaluation_status, "evaluated_non_actionable");
  assert.equal(built.source_phase, "Phase 4O");
});

// 8. Builder input_artifact_refs references both source artifacts
test("builder input_artifact_refs references signal_definition and market_snapshot correctly", async () => {
  const defFixture = await loadFixture("synthetic_kalshi_strategy_signal_definition.json");
  const snapFixture = await loadFixture("synthetic_kalshi_market_snapshot.json");

  const built = buildKalshiSignalEvaluationSummary(defFixture, snapFixture);
  assert.equal(
    built.input_artifact_refs.signal_definition.artifact_id,
    defFixture.kalshi_strategy_signal_definition_id
  );
  assert.equal(
    built.input_artifact_refs.signal_definition.schema_version,
    "kalshi_strategy_signal_definition.v1"
  );
  assert.equal(
    built.input_artifact_refs.market_snapshot.artifact_id,
    snapFixture.kalshi_market_snapshot_id
  );
  assert.equal(
    built.input_artifact_refs.market_snapshot.schema_version,
    "kalshi_market_snapshot.v1"
  );
});
