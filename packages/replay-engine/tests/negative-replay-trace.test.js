import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { validateReplayTraceFile } from "../src/validate-replay-trace.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "replay-engine", "fixtures", "negative");

const negativeFixtures = [
  ["malformed_replay_trace.jsonl", /Unexpected|JSON/],
  ["bad_replay_trace_id.jsonl", /replay_trace_id must be deterministic/],
  ["missing_trace_provenance.jsonl", /source_replay_clock_id is required/],
  ["replay_trace_unsafe_live_execution_allowed.jsonl", /live_execution_allowed must be false/],
  ["replay_trace_unsafe_order_placement_allowed.jsonl", /order_placement_allowed must be false/],
  ["non_paper_only_replay_trace.jsonl", /paper_only must be true/],
  ["invalid_trace_event_type.jsonl", /trace_event_type is invalid/],
  ["invalid_trace_status.jsonl", /status is invalid/],
  ["non_monotonic_trace_index.jsonl", /trace_index must be deterministic and contiguous/],
  ["duplicate_replay_trace_id.jsonl", /replay_trace_id values must be unique/],
  ["bad_trace_record_time.jsonl", /record_time must be a valid timestamp/],
  ["unsafe_trace_artifact_path.jsonl", /artifact_path artifact_path must not escape the repo/],
  ["forbidden_trace_execution_field.jsonl", /forbidden execution, strategy, bankroll, model, or recommendation field/],
  ["missing_trace_record_id_for_read.jsonl", /noop_record_read traces must include a record_id/],
  ["bad_trace_record_ref.jsonl", /noop_record_read record_ref must reference artifact_path/],
  ["bad_trace_lifecycle.jsonl", /ReplayTrace must start with noop_replay_started/]
];

for (const [fixtureName, expectedMessage] of negativeFixtures) {
  test(`${fixtureName} fails ReplayTrace validation deterministically`, async () => {
    const report = await validateReplayTraceFile({
      filePath: path.join(negativeDir, fixtureName),
      repoRoot
    });

    assert.equal(report.ok, false);
    assert.match(report.errors.join("\n"), expectedMessage);
  });
}
