import { kalshiSignalEvaluationSummaryId } from "./kalshi-signal-evaluation-summary-id.js";

// Approved condition families for Phase 4O.
export const APPROVED_CONDITION_FAMILIES = new Set(["descriptive_market_movement"]);

// Default options used when building the synthetic fixture.
export const defaultEvaluationOptions = {
  evaluationMode: "local_fixture_evaluation_only",
  evaluationPhase: "Phase 4O",
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
 *   - input_field: the derived field name recorded in evaluated_thresholds
 *   - derive(snap, opts): produces the observed numeric value from the snapshot
 */
const observedFieldMap = {
  max_spread_cents: {
    input_field: "spread_cents",
    derive: (snap) => snap.yes_ask_cents - snap.yes_bid_cents,
  },
  min_volume: {
    input_field: "volume",
    derive: (snap) => snap.volume,
  },
  min_open_interest: {
    input_field: "open_interest",
    derive: (snap) => snap.open_interest,
  },
  max_snapshot_age_seconds: {
    input_field: "snapshot_age_seconds",
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
 * - Non-actionable: does not emit signals, recommendations, decisions, or orders.
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
      input_field: mapping.input_field,
      observed_value,
      required_for_evaluation,
      passed,
    });
  }

  const thresholds_evaluated_count = evaluatedThresholds.length;
  const thresholds_passed_count = evaluatedThresholds.filter((t) => t.passed).length;
  const thresholds_failed_count = evaluatedThresholds.filter((t) => !t.passed).length;
  const evaluation_complete = thresholds_failed_count === 0;

  return {
    kalshi_signal_evaluation_summary_id: id,
    schema_version: "kalshi_signal_evaluation_summary.v1",
    generated_at: options.generatedAt,
    signal_definition_id: signalDefinitionFixture.kalshi_strategy_signal_definition_id,
    market_snapshot_id: marketSnapshotFixture.kalshi_market_snapshot_id,
    evaluation_mode: options.evaluationMode,
    evaluation_phase: options.evaluationPhase,
    condition_family: signalDefinitionFixture.condition_family,

    evaluated_thresholds: evaluatedThresholds,

    research_summary: {
      thresholds_evaluated_count,
      thresholds_passed_count,
      thresholds_failed_count,
      evaluation_complete,
    },

    evaluation_status: "evaluated_non_actionable",

    // Safety flags — hardcoded, never sourced from input.
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    credentials_used: false,
    network_request_used: false,
    actionable: false,
    signal_emitted: false,

    reason_code: "EVALUATION_COMPLETE_NON_ACTIONABLE",
    reason: "thresholds evaluated non-actionably",
  };
}
