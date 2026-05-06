import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { buildReplayClock } from "../src/build-replay-clock.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "replay-engine", "fixtures", "synthetic_replay_clock.json");

test("buildReplayClock matches synthetic fixture", async () => {
  const expected = JSON.parse(await readFile(fixturePath, "utf8"));
  const actual = await buildReplayClock({ repoRoot });

  assert.deepEqual(actual, expected);
});

test("buildReplayClock orders records by replay time and deterministic tie breakers", async () => {
  const clock = await buildReplayClock({ repoRoot });

  assert.equal(clock.paper_only, true);
  assert.equal(clock.live_execution_allowed, false);
  assert.equal(clock.order_placement_allowed, false);
  assert.equal(clock.clock_events.length, 18);
  assert.deepEqual(clock.clock_events.map((event) => event.clock_index), [...Array(18).keys()]);
  assert.equal(clock.clock_events[0].record_id, "evt_synth_000001");
  assert.equal(clock.clock_events.at(-1).artifact_type, "paper_performance_summary");
  assert.equal(clock.clock_events.at(-1).record_time, "2026-04-28T14:05:01Z");
});
