export function validateRiskPolicy(policy) {
  const errors = [];
  if (!policy || typeof policy !== "object") {
    return ["policy must be an object"];
  }
  if (policy.mode !== "paper_only") {
    errors.push("policy mode must be paper_only");
  }
  if (typeof policy.min_net_edge !== "number") {
    errors.push("policy min_net_edge must be a number");
  }
  if (!Array.isArray(policy.allowed_liquidity_statuses) || policy.allowed_liquidity_statuses.length === 0) {
    errors.push("policy allowed_liquidity_statuses must be a non-empty array");
  }
  if (policy.required_staleness_status !== "fresh") {
    errors.push("policy required_staleness_status must be fresh");
  }
  if (!Array.isArray(policy.fatal_quality_flags)) {
    errors.push("policy fatal_quality_flags must be an array");
  }
  if (!Number.isInteger(policy.min_observed_price) || !Number.isInteger(policy.max_observed_price) || policy.min_observed_price > policy.max_observed_price) {
    errors.push("policy observed price bounds are invalid");
  }
  if (typeof policy.max_total_estimated_cost !== "number" || policy.max_total_estimated_cost < 0) {
    errors.push("policy max_total_estimated_cost must be non-negative");
  }
  if (typeof policy.min_model_probability !== "number" || typeof policy.max_model_probability !== "number" || policy.min_model_probability < 0 || policy.max_model_probability > 1 || policy.min_model_probability > policy.max_model_probability) {
    errors.push("policy model probability bounds are invalid");
  }
  if (!Array.isArray(policy.allowed_sides) || policy.allowed_sides.some((side) => side !== "YES" && side !== "NO")) {
    errors.push("policy allowed_sides must contain only YES or NO");
  }
  if (!Number.isInteger(policy.max_paper_exposure_cents) || policy.max_paper_exposure_cents < 0) {
    errors.push("policy max_paper_exposure_cents must be a non-negative integer");
  }
  return errors;
}

export function evaluateRiskChecks(signal, policy) {
  const policyErrors = validateRiskPolicy(policy);
  if (policyErrors.length > 0) {
    return { status: "risk_needs_review", reasons: policyErrors };
  }

  const reasons = [];
  const totalEstimatedCost = totalCost(signal);

  if (signal.net_edge < policy.min_net_edge) {
    reasons.push("net_edge_below_minimum");
  }
  if (!policy.allowed_liquidity_statuses.includes(signal.liquidity_status)) {
    reasons.push("liquidity_status_not_allowed");
  }
  if (signal.staleness_status !== policy.required_staleness_status) {
    reasons.push("staleness_status_not_fresh");
  }
  const fatalFlags = signal.quality_flags.filter((flag) => policy.fatal_quality_flags.includes(flag));
  if (fatalFlags.length > 0) {
    reasons.push(`fatal_quality_flags:${fatalFlags.join(",")}`);
  }
  if (signal.observed_price < policy.min_observed_price || signal.observed_price > policy.max_observed_price) {
    reasons.push("observed_price_out_of_bounds");
  }
  if (totalEstimatedCost > policy.max_total_estimated_cost) {
    reasons.push("estimated_cost_exceeds_maximum");
  }
  if (signal.model_probability < policy.min_model_probability || signal.model_probability > policy.max_model_probability) {
    reasons.push("model_probability_out_of_bounds");
  }
  if (!policy.allowed_sides.includes(signal.side)) {
    reasons.push("side_not_allowed");
  }
  if (signal.edge_status !== "positive" || signal.action_eligibility !== "candidate_only") {
    reasons.push("edge_signal_not_candidate_only_positive");
  }

  return {
    status: reasons.length === 0 ? "risk_approved" : "risk_rejected",
    reasons: reasons.length === 0 ? ["all_risk_checks_passed"] : reasons,
    totalEstimatedCost
  };
}

export function totalCost(signal) {
  return round(signal.estimated_fee_cost + signal.estimated_spread_cost + signal.estimated_slippage_cost + signal.uncertainty_penalty);
}

function round(value) {
  const rounded = Math.round(value * 10_000) / 10_000;
  return Object.is(rounded, -0) ? 0 : rounded;
}
