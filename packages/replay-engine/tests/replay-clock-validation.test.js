import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { validateReplayClock, validateReplayClockFile } from "../src/validate-replay-clock.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = path.join(repoRoot, "packages", "replay-engine", "fixtures", "synthetic_replay_clock.json");

test("synthetic ReplayClock validates", async () => {
  const report = await validateReplayClockFile({ filePath: fixturePath, repoRoot });

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test("ReplayClock validator rejects bad id and unsafe flags", async () => {
  const clock = await loadClock();
  const report = await validateReplayClock({
    ...clock,
    replay_clock_id: "bad",
    live_execution_allowed: true
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /replay_clock_id must be deterministic/);
  assert.match(report.errors.join("\n"), /live_execution_allowed must be false/);
});

test("ReplayClock validator rejects unsafe paths and non-deterministic ordering", async () => {
  const clock = await loadClock();
  const swapped = [clock.clock_events[1], clock.clock_events[0], ...clock.clock_events.slice(2)]
    .map((event, index) => ({ ...event, clock_index: index }));
  swapped[2] = { ...swapped[2], artifact_path: "../outside.jsonl" };
  const report = await validateReplayClock({
    ...clock,
    clock_events: swapped
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /clock_events must be sorted/);
  assert.match(report.errors.join("\n"), /artifact_path artifact_path must not escape the repo/);
});

test("ReplayClock validator rejects invalid record time and status", async () => {
  const clock = await loadClock();
  const report = await validateReplayClock({
    ...clock,
    status: "replay_executed",
    clock_events: [{ ...clock.clock_events[0], record_time: "not-time" }]
  }, { repoRoot });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /status is invalid/);
  assert.match(report.errors.join("\n"), /record_time must be a valid timestamp/);
});

async function loadClock() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}
