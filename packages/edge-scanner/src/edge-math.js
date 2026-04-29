export function assertProbability(probability) {
  if (typeof probability !== "number" || probability < 0 || probability > 1) {
    throw new Error("model_probability must be between 0 and 1");
  }
}

export function rawEdgeCents({ modelProbability, observedPrice }) {
  assertProbability(modelProbability);
  assertPrice(observedPrice, "observed_price");
  return roundCents(modelProbability * 100 - observedPrice);
}

export function estimatedFeeCostCents({ observedPrice, feeRateBps = 100 }) {
  assertPrice(observedPrice, "observed_price");
  return roundCents(observedPrice * (feeRateBps / 10_000));
}

export function estimatedSpreadCostCents(spread) {
  if (spread === null) {
    return null;
  }
  assertNumber(spread, "spread");
  return roundCents(Math.max(0, spread / 2));
}

export function estimatedSlippageCostCents({ spread, slippageRate = 0.25 }) {
  if (spread === null) {
    return null;
  }
  assertNumber(spread, "spread");
  return roundCents(Math.max(0, spread * slippageRate));
}

export function uncertaintyPenaltyCents({ uncertainty = 0 }) {
  if (typeof uncertainty !== "number" || uncertainty < 0 || uncertainty > 1) {
    throw new Error("uncertainty must be between 0 and 1");
  }
  return roundCents(uncertainty * 100);
}

export function netEdgeCents({ rawEdge, feeCost, spreadCost, slippageCost, uncertaintyPenalty }) {
  for (const [name, value] of Object.entries({ rawEdge, feeCost, spreadCost, slippageCost, uncertaintyPenalty })) {
    assertNumber(value, name);
  }

  return roundCents(rawEdge - feeCost - spreadCost - slippageCost - uncertaintyPenalty);
}

export function roundCents(value) {
  const rounded = Math.round(value * 10_000) / 10_000;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function assertPrice(value, name) {
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new Error(`${name} must be an integer cent value from 0 to 100`);
  }
}

function assertNumber(value, name) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${name} must be a number`);
  }
}
