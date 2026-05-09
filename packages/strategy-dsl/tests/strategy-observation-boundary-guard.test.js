import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import {
  observationValidationReasonCodes,
  validateObservationBoundary,
  validateSafeStrategyDslArtifactPath
} from "../src/strategy-observation-boundary-guard.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");

test("validateObservationBoundary catches nested forbidden fields and case-insensitive values", () => {
  const report = validateObservationBoundary({
    nested: {
      safe: {
        order_request: { status: "blocked" }
      }
    },
    reason: "recommended_action: BUY"
  });

  assert.equal(report.ok, false);
  assert.equal(report.errors.some((error) => error.reason_code === observationValidationReasonCodes.ERR_FORBIDDEN_KEY_DETECTED), true);
  assert.equal(report.errors.some((error) => error.reason_code === observationValidationReasonCodes.ERR_REASON_TEXT_UNSAFE), true);
});

test("validateObservationBoundary can inspect raw source metadata without scanning raw values", () => {
  const rawHistoricalSource = {
    source_type: "immutable_snapshot",
    raw_payload: "Historical market text may mention buy, sell, trade, order, or Kalshi without becoming generated metadata."
  };
  const before = JSON.stringify(rawHistoricalSource);
  const report = validateObservationBoundary(rawHistoricalSource, { scanStringValues: false });

  assert.equal(report.ok, true);
  assert.equal(JSON.stringify(rawHistoricalSource), before);
});

test("validateSafeStrategyDslArtifactPath rejects unsafe local paths", async () => {
  const unsafePaths = [
    "C:/Users/example/artifact.json",
    "../packages/strategy-dsl/fixtures/synthetic_strategy_observation_contract.json",
    "https://example.invalid/artifact.json",
    "packages/../packages/strategy-dsl/fixtures/synthetic_strategy_observation_contract.json",
    "packages/strategy-dsl/fixtures/secrets/api_key.json"
  ];

  for (const artifactPath of unsafePaths) {
    const errors = [];
    await validateSafeStrategyDslArtifactPath(errors, repoRoot, artifactPath);
    assert.ok(errors.length > 0, `${artifactPath} should be rejected`);
  }
});

test("validateObservationBoundary output is deterministic", () => {
  const payload = { reason: "sell trigger" };
  const first = validateObservationBoundary(payload);
  const second = validateObservationBoundary(payload);

  assert.deepEqual(first, second);
});
