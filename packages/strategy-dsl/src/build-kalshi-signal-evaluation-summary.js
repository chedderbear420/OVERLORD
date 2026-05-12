import { kalshiSignalEvaluationSummaryId } from "./kalshi-signal-evaluation-summary-id.js";

// Approved condition families for Phase 4O.
export const APPROVED_CONDITION_FAMILIES = new Set(["descriptive_market_movement"]);

// Approved data_source_field values for evaluated threshold items.
export const APPROVED_DATA_SOURCE_FIELDS = new Set([
  "yes_ask_cents_minus_yes_bid_cents",
  "volume",
  "open_interest",
  "generated_at",
]);

// Approved status values for evaluated threshold items.
export const APPROVED_THRESHOLD_STATUSES = new Set(["evaluated"]);

// Default options used when building the synthetic fixture.
export const defaultEvaluationOptions = {
  evaluationMode: "local_fixture_evaluation_only",
  generatedAt: "2026-05-11T00:00:00Z",
  evaluationTimestamp: "2026-05-11T00:00:00Z",
  thresholdValues: {
    max_spread_cents: 5,
    min_volume: 1000,
    min_open_interest: 500,
    max_snapshot_age_seconds: 300,
  },
};

/**
 * Maps each approved threshold_name to:
 *   - data_source_field: the approved field label recorded in evaluated_thresholds
 *   - derive(snap, opts): produces the observed numeric value from the snapshot
 */
const observedFieldMap = {
  max_spread_cents: {
    data_source_field: "yes_ask_cents_minus_yes_bid_cents",
    derive: (snap) => snap.yes_ask_cents - snap.yes_bid_cents,
  },
  min_volume: {
    data_source_field: "volume",
    derive: (snap) => snap.volume,
  },
  min_open_interest: {
    data_source_field: "open_interest",
    derive: (snap) => snap.open_interest,
  },
  max_snapshot_age_seconds: {
    data_source_field: "generated_at",
    derive: (snap, opts) => {
      const snapshotMs = Date.parse(snap.generated_at);
      const evalMs = Date.parse(opts.evaluationTimestamp);
      return (evalMs - snapshotMs) / 1000;
    },
  },
};

function applyComparison(observedValue, comparison, thresholdValue) {
  if (comparison === "lte") return observedValue <= thresholdValue;
  if (comparison === "gte") return observedValue >= thresholdValue;
  return false;
}

/**
 * Build a canonical KalshiSignalEvaluationSummary.
 *
 * Contract:
 * - No file I/O.
 * - No network requests.
 * - No environment variables.
 * - No credentials.
 * - All safety flags hardcoded.
 * - Non-actionable: does not emit signals, recommendations, decisions, orders,
 *   or paper ledger entries.
 * - Evaluation is descriptive only — result cannot trigger any execution path.
 *
 * @param {object} signalDefinitionFixture  A KalshiStrategySignalDefinition object (Phase 4N).
 * @param {object} marketSnapshotFixture    A KalshiMarketSnapshot object (Phase 4M).
 * @param {object} opts                     Override defaults for testing.
 * @returns {object}  KalshiSignalEvaluationSummary
 */
export function buildKalshiSignalEvaluationSummary(
  signalDefinitionFixture,
  marketSnapshotFixture,
  opts = {}
) {
  const options = {
    ...defaultEvaluationOptions,
    ...opts,
    thresholdValues: {
      ...defaultEvaluationOptions.thresholdValues,
      ...(opts.thresholdValues ?? {}),
    },
  };

  const id = kalshiSignalEvaluationSummaryId({
    signalDefinitionId: signalDefinitionFixture.kalshi_strategy_signal_definition_id,
    marketSnapshotId: marketSnapshotFixture.kalshi_market_snapshot_id,
    evaluationMode: options.evaluationMode,
    schemaVersion: "kalshi_signal_evaluation_summary.v1",
    conditionFamily: signalDefinitionFixture.condition_family,
  });

  const evaluatedThresholds = [];
  for (const thresholdDef of signalDefinitionFixture.threshold_definitions) {
    const { threshold_name, comparison, required_for_evaluation } = thresholdDef;
    const mapping = observedFieldMap[threshold_name];
    const threshold_value = options.thresholdValues[threshold_name];
    const observed_value = mapping.derive(marketSnapshotFixture, options);
    const passed = applyComparison(observed_value, comparison, threshold_value);
    evaluatedThresholds.push({
      threshold_name,
      threshold_value,
      comparison,
      data_source_field: mapping.data_source_field,
      observed_value,
      required_for_evaluation,
      status: "evaluated",
      passed,
    });
  }

  const thresholds_evaluated_count = evaluatedThresholds.length;
  const thresholds_passed_count = evaluatedThresholds.filter((t) => t.passed).length;
  const thresholds_failed_count = evaluatedThresholds.filter((t) => !t.passed).length;
  const evaluation_complete = thresholds_failed_count === 0;

  const signalDefinitionId = signalDefinitionFixture.kalshi_strategy_signal_definition_id;
  const marketSnapshotId = marketSnapshotFixture.kalshi_market_snapshot_id;

  return {
    kalshi_signal_evaluation_summary_id: id,
    schema_version: "kalshi_signal_evaluation_summary.v1",
    generated_at: options.generatedAt,
    evaluation_mode: options.evaluationMode,

    // Source lineage — hardcoded phase and schema versions.
    source_phase: "Phase 4O",
    signal_definition_id: signalDefinitionId,
    signal_definition_schema_version: "kalshi_strategy_signal_definition.v1",
    market_snapshot_id: marketSnapshotId,
    market_snapshot_schema_version: "kalshi_market_snapshot.v1",
    condition_family: signalDefinitionFixture.condition_family,

    input_artifact_refs: {
      signal_definition: {
        artifact_id: signalDefinitionId,
        schema_version: "kalshi_strategy_signal_definition.v1",
      },
      market_snapshot: {
        artifact_id: marketSnapshotId,
        schema_version: "kalshi_market_snapshot.v1",
      },
    },

    evaluated_thresholds: evaluatedThresholds,
    evaluation_status: "evaluated_non_actionable",
    data_quality_status: "complete",

    research_summary: {
      thresholds_evaluated_count,
      thresholds_passed_count,
      thresholds_failed_count,
      evaluation_complete,
    },

    // Safety flags — hardcoded, never sourced from input.
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    credentials_used: false,
    network_request_used: false,

    // Emit flags — all false. Phase 4O emits nothing.
    emits_signal_events: false,
    emits_recommendations: false,
    emits_decisions: false,
    emits_orders: false,
    emits_paper_ledger_entries: false,

    reason_code: "EVALUATION_COMPLETE_NON_ACTIONABLE",
    reason: "thresholds evaluated non-actionably",
  };
}
