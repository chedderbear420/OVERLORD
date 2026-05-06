export const allowedStrategyTypes = new Set(["noop_strategy_contract", "rule_based_strategy_contract"]);
export const allowedStrategyStatuses = new Set(["strategy_definition_ready", "strategy_definition_rejected"]);
export const allowedRunModes = new Set(["validation_only", "dry_run_planned"]);
export const allowedRunIntentStatuses = new Set(["strategy_run_intent_ready", "strategy_run_intent_rejected"]);
export const allowedReplayModes = new Set(["offline_fixture_replay"]);
export const allowedInputs = new Set(["market_state", "edge_signal", "replay_trace", "replay_clock", "replay_read_plan"]);
export const requiredForbiddenOutputs = [
  "live_order",
  "real_trade",
  "credential",
  "api_key",
  "bankroll_allocation",
  "recommendation"
];

export const forbiddenMetadataFields = new Set([
  "execute",
  "execution_plan",
  "executable",
  "code",
  "handler",
  "callback",
  "function_body",
  "network",
  "endpoint",
  "api_key",
  "credential",
  "secret",
  "token",
  "websocket",
  "poll",
  "live_trade",
  "live_order",
  "order",
  "order_id",
  "order_request",
  "trade_request",
  "signal_request",
  "decision_request",
  "bankroll_growth",
  "bankroll_allocation",
  "roi",
  "sharpe_ratio",
  "kelly_fraction",
  "recommendation",
  "recommended_action",
  "live_trade_recommendation"
]);

export function validateForbiddenFields(errors, value, pathParts = []) {
  if (!value || typeof value !== "object") {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => validateForbiddenFields(errors, entry, [...pathParts, String(index)]));
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenMetadataFields.has(key)) {
      const fieldPath = [...pathParts, key].join(".");
      errors.push(`forbidden strategy runtime, execution, live, bankroll, recommendation, order, or trade field is not allowed: ${fieldPath}`);
    }
    validateForbiddenFields(errors, nested, [...pathParts, key]);
  }
}

export function hasAllRequiredForbiddenOutputs(forbiddenOutputs) {
  return requiredForbiddenOutputs.every((output) => forbiddenOutputs.includes(output));
}
