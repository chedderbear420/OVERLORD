import {
  estimatedFeeCostCents,
  estimatedSlippageCostCents,
  estimatedSpreadCostCents,
  netEdgeCents,
  rawEdgeCents,
  uncertaintyPenaltyCents
} from "./edge-math.js";
import { edgeSignalId } from "./edge-signal-id.js";

export function buildEdgeSignal({ marketState, modelProbability, options = {} }) {
  const side = modelProbability.side;
  const observedPrice = observedPriceForSide(marketState, side);
  const spread = spreadForSide(marketState, side);
  const modelProb = modelProbability.model_probability;
  const uncertainty = modelProbability.uncertainty ?? 0;
  const rawEdge = rawEdgeCents({ modelProbability: modelProb, observedPrice });
  const feeCost = estimatedFeeCostCents({ observedPrice, feeRateBps: options.feeRateBps ?? 100 });
  const spreadCost = estimatedSpreadCostCents(spread);
  const slippageCost = estimatedSlippageCostCents({ spread, slippageRate: options.slippageRate ?? 0.25 });
  const uncertaintyPenalty = uncertaintyPenaltyCents({ uncertainty });
  const netEdge = netEdgeCents({
    rawEdge,
    feeCost,
    spreadCost,
    slippageCost,
    uncertaintyPenalty
  });
  const status = classifySignal({
    netEdge,
    marketState,
    minNetEdge: options.minNetEdge ?? 1
  });

  return {
    signal_id: edgeSignalId({
      sourceStateId: marketState.state_id,
      side,
      modelId: modelProbability.model_id
    }),
    schema_version: "edge_signal.v1",
    source_state_id: marketState.state_id,
    source_event_id: marketState.source_event_id,
    source_payload_hash: marketState.source_payload_hash,
    market_id: marketState.market_id,
    captured_at: marketState.captured_at,
    received_at: marketState.received_at,
    side,
    observed_price: observedPrice,
    model_id: modelProbability.model_id,
    model_version: modelProbability.model_version,
    model_probability: modelProb,
    raw_edge: rawEdge,
    estimated_fee_cost: feeCost,
    estimated_spread_cost: spreadCost,
    estimated_slippage_cost: slippageCost,
    uncertainty_penalty: uncertaintyPenalty,
    net_edge: netEdge,
    liquidity_status: marketState.liquidity_status,
    staleness_status: marketState.staleness_status,
    quality_flags: marketState.quality_flags,
    edge_status: status.edgeStatus,
    risk_status: "not_evaluated",
    action_eligibility: status.actionEligibility,
    reason: status.reason
  };
}

export function buildEdgeSignals({ marketStates, modelProbabilities, options = {} }) {
  const statesById = new Map(marketStates.map((state) => [state.state_id, state]));
  return modelProbabilities.map((probability) => {
    const marketState = statesById.get(probability.source_state_id);
    if (!marketState) {
      throw new Error(`No MarketState found for source_state_id ${probability.source_state_id}`);
    }
    return buildEdgeSignal({ marketState, modelProbability: probability, options });
  });
}

function observedPriceForSide(marketState, side) {
  if (side === "YES") {
    return requirePrice(marketState.best_yes_ask, "best_yes_ask");
  }
  if (side === "NO") {
    return requirePrice(marketState.best_no_ask, "best_no_ask");
  }
  throw new Error("side must be YES or NO");
}

function spreadForSide(marketState, side) {
  if (side === "YES") {
    return marketState.yes_spread;
  }
  if (side === "NO") {
    return marketState.no_spread;
  }
  throw new Error("side must be YES or NO");
}

function requirePrice(value, field) {
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new Error(`${field} must be an integer cent value from 0 to 100`);
  }
  return value;
}

function classifySignal({ netEdge, marketState, minNetEdge }) {
  if (marketState.staleness_status !== "fresh") {
    return {
      edgeStatus: "rejected",
      actionEligibility: "rejected",
      reason: `Rejected: staleness_status is ${marketState.staleness_status}.`
    };
  }

  if (marketState.liquidity_status !== "liquid") {
    return {
      edgeStatus: "rejected",
      actionEligibility: "rejected",
      reason: `Rejected: liquidity_status is ${marketState.liquidity_status}.`
    };
  }

  if (marketState.quality_flags.length > 0) {
    return {
      edgeStatus: "rejected",
      actionEligibility: "rejected",
      reason: "Rejected: MarketState contains quality flags."
    };
  }

  if (netEdge > minNetEdge) {
    return {
      edgeStatus: "positive",
      actionEligibility: "candidate_only",
      reason: "Positive fee-aware net edge candidate; descriptive only."
    };
  }

  if (netEdge < 0) {
    return {
      edgeStatus: "negative",
      actionEligibility: "rejected",
      reason: "Rejected: fee-aware net edge is negative."
    };
  }

  return {
    edgeStatus: "zero_or_insufficient",
    actionEligibility: "rejected",
    reason: "Rejected: fee-aware net edge does not exceed candidate threshold."
  };
}
