import assert from "node:assert/strict";
import test from "node:test";
import {
  estimatedFeeCostCents,
  estimatedSlippageCostCents,
  estimatedSpreadCostCents,
  netEdgeCents,
  rawEdgeCents,
  uncertaintyPenaltyCents
} from "../src/edge-math.js";

test("calculates fee-aware edge costs in cents", () => {
  assert.equal(rawEdgeCents({ modelProbability: 0.62, observedPrice: 51 }), 11);
  assert.equal(estimatedFeeCostCents({ observedPrice: 51 }), 0.51);
  assert.equal(estimatedSpreadCostCents(4), 2);
  assert.equal(estimatedSlippageCostCents({ spread: 4 }), 1);
  assert.equal(uncertaintyPenaltyCents({ uncertainty: 0.03 }), 3);
  assert.equal(netEdgeCents({
    rawEdge: 11,
    feeCost: 0.51,
    spreadCost: 2,
    slippageCost: 1,
    uncertaintyPenalty: 3
  }), 4.49);
});

test("rejects bad probability and invalid observed price", () => {
  assert.throws(() => rawEdgeCents({ modelProbability: 1.1, observedPrice: 51 }), /model_probability/);
  assert.throws(() => rawEdgeCents({ modelProbability: 0.5, observedPrice: 101 }), /observed_price/);
});
