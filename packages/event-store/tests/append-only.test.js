import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { appendEnvelopesToSegment } from "../src/segment-writer.js";
import { readText, loadPositiveEnvelopes, repoRoot, withTempDir } from "./segment-test-helpers.js";

test("appending adds records without mutating existing segment bytes", async () => {
  await withTempDir(async (dir) => {
    const envelopes = await loadPositiveEnvelopes();
    const segmentPath = path.join(dir, "synthetic_fixture-2026-04-28.jsonl");

    const firstAppend = await appendEnvelopesToSegment({
      segmentPath,
      envelopes: [envelopes[0]],
      repoRoot,
      auditTimestamp: "2026-04-28T15:00:00Z"
    });
    assert.equal(firstAppend.ok, true);
    const before = await readText(segmentPath);

    const secondAppend = await appendEnvelopesToSegment({
      segmentPath,
      envelopes: [envelopes[1]],
      repoRoot,
      auditTimestamp: "2026-04-28T15:00:01Z"
    });
    assert.equal(secondAppend.ok, true);
    const after = await readText(segmentPath);

    assert.equal(after.startsWith(before), true);
    assert.equal(after.split(/\r?\n/).filter(Boolean).length, 2);
  });
});

test("rejected append leaves existing segment unchanged", async () => {
  await withTempDir(async (dir) => {
    const envelopes = await loadPositiveEnvelopes();
    const segmentPath = path.join(dir, "synthetic_fixture-2026-04-28.jsonl");

    await appendEnvelopesToSegment({
      segmentPath,
      envelopes: [envelopes[0]],
      repoRoot,
      auditTimestamp: "2026-04-28T15:00:00Z"
    });
    const before = await readText(segmentPath);

    const duplicate = structuredClone(envelopes[0]);
    const rejected = await appendEnvelopesToSegment({
      segmentPath,
      envelopes: [duplicate],
      repoRoot,
      auditTimestamp: "2026-04-28T15:00:01Z"
    });
    const after = await readText(segmentPath);

    assert.equal(rejected.ok, false);
    assert.match(rejected.errors.join("\n"), /duplicate event_id/);
    assert.equal(after, before);
  });
});
