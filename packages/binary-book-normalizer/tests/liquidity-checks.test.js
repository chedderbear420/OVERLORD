import assert from "node:assert/strict";
import test from "node:test";
import { liquidityStatus, stalenessStatus } from "../src/liquidity-checks.js";

test("liquidityStatus classifies empty, thin, liquid, and invalid books", () => {
  assert.equal(liquidityStatus({ yesDepth: 0, noDepth: 0, qualityFlags: [] }), "empty");
  assert.equal(liquidityStatus({ yesDepth: 24, noDepth: 100, qualityFlags: [] }), "thin");
  assert.equal(liquidityStatus({ yesDepth: 25, noDepth: 25, qualityFlags: [] }), "liquid");
  assert.equal(liquidityStatus({ yesDepth: 100, noDepth: 100, qualityFlags: ["crossed_book"] }), "invalid");
});

test("stalenessStatus is deterministic for fresh, stale, missing, future, and invalid timestamps", () => {
  assert.equal(
    stalenessStatus({
      capturedAt: "2026-04-28T14:00:00Z",
      receivedAt: "2026-04-28T14:00:30Z"
    }),
    "fresh"
  );
  assert.equal(
    stalenessStatus({
      capturedAt: "2026-04-28T14:00:00Z",
      receivedAt: "2026-04-28T14:02:00Z"
    }),
    "stale"
  );
  assert.equal(stalenessStatus({ capturedAt: "", receivedAt: "2026-04-28T14:00:00Z" }), "missing_timestamp");
  assert.equal(
    stalenessStatus({
      capturedAt: "2026-04-28T14:01:00Z",
      receivedAt: "2026-04-28T14:00:00Z"
    }),
    "future_timestamp"
  );
  assert.equal(stalenessStatus({ capturedAt: "bad", receivedAt: "2026-04-28T14:00:00Z" }), "invalid_timestamp");
});
