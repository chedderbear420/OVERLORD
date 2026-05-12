import { kalshiStrategySignalDefinitionId } from "./kalshi-strategy-signal-definition-id.js";

// Approved allowed_input_fields sourced from KalshiMarketSnapshot (Phase 4M).
export const APPROVED_INPUT_FIELDS = new Set([
  "market_ticker",
  "event_ticker",
  "market_status",
  "yes_ask_cents",
  "yes_bid_cents",
  "no_ask_cents",
  "no_bid_cents",
  "last_price_cents",
  "volume",
  "open_interest",
  "generated_at",
]);

// Approved threshold names, value types, and comparisons.
export const APPROVED_THRESHOLD_NAMES = new Set([
  "max_spread_cents",
  "min_volume",
  "min_open_interest",
  "max_snapshot_age_seconds",
]);
export const APPROVED_VALUE_TYPES = new Set(["integer", "number"]);
export const APPROVED_COMPARISONS = new Set(["lte", "gte"]);

// The default raw options for the synthetic fixture.
export const defaultDefinitionOptions = {
  definitionName: "market_snapshot_movement_condition_definition",
  definitionVersion: "0.1.0-definition-only",
  definitionMode: "definition_only",
  sourceArtifactType: "kalshi_market_snapshot",
  sourceSchemaVersion: "kalshi_market_snapshot.v1",
  sourcePhase: "Phase 4M",
  conditionFamily: "descriptive_market_movement",
  generatedAt: "2026-05-11T00:00:00Z",
};

/**
 * Build a canonical KalshiStrategySignalDefinition object.
 *
 * Contract:
 * - No file I/O.
 * - No network requests.
 * - No environment variables.
 * - No credentials.
 * - All safety flags hardcoded.
 * - This object is a contract definition only — it does not emit, evaluate,
 *   or produce signals, picks, recommendations, decisions, or orders.
 *
 * @param {object} opts  Override defaults for testing (generatedAt, etc.)
 * @returns {object}     KalshiStrategySignalDefinition
 */
export function buildKalshiStrategySignalDefinition(opts = {}) {
  const options = { ...defaultDefinitionOptions, ...opts };

  const id = kalshiStrategySignalDefinitionId({
    definitionName: options.definitionName,
    definitionVersion: options.definitionVersion,
    sourceArtifactType: options.sourceArtifactType,
    sourceSchemaVersion: options.sourceSchemaVersion,
    definitionMode: options.definitionMode,
  });

  return {
    kalshi_strategy_signal_definition_id: id,
    schema_version: "kalshi_strategy_signal_definition.v1",
    generated_at: options.generatedAt,
    definition_name: options.definitionName,
    definition_version: options.definitionVersion,
    definition_mode: options.definitionMode,
    source_artifact_type: options.sourceArtifactType,
    source_schema_version: options.sourceSchemaVersion,
    source_phase: options.sourcePhase,

    allowed_input_fields: [
      "market_ticker",
      "event_ticker",
      "market_status",
      "yes_ask_cents",
      "yes_bid_cents",
      "no_ask_cents",
      "no_bid_cents",
      "last_price_cents",
      "volume",
      "open_interest",
      "generated_at",
    ],

    condition_family: options.conditionFamily,

    threshold_definitions: [
      {
        threshold_name: "max_spread_cents",
        value_type: "integer",
        comparison: "lte",
        required_for_evaluation: true,
      },
      {
        threshold_name: "min_volume",
        value_type: "integer",
        comparison: "gte",
        required_for_evaluation: true,
      },
      {
        threshold_name: "min_open_interest",
        value_type: "integer",
        comparison: "gte",
        required_for_evaluation: false,
      },
      {
        threshold_name: "max_snapshot_age_seconds",
        value_type: "number",
        comparison: "lte",
        required_for_evaluation: false,
      },
    ],

    output_contract: {
      emits_signal_events: false,
      emits_recommendations: false,
      emits_decisions: false,
      emits_orders: false,
      emits_paper_ledger_entries: false,
      evaluation_phase_required: "Phase 4O",
    },

    forbidden_outputs: [
      "signal_event",
      "pick",
      "recommendation",
      "decision",
      "order",
      "trade",
      "execution",
      "bankroll",
      "position_size",
      "expected_value",
      "edge",
      "pnl",
      "paper_ledger_entry",
    ],

    // Safety flags — hardcoded, never sourced from input.
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    credentials_used: false,
    network_request_used: false,
    evaluation_allowed: false,

    reason_code: "DEFINITION_CONTRACT_READY",
    reason: "definition contract ready",
  };
}
