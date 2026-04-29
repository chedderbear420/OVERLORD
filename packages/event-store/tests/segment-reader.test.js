import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { readSegment } from "../src/segment-reader.js";
import { appendEnvelopesToSegment } from "../src/segment-writer.js";
import { segmentFileName, segmentPath } from "../src/segment-paths.js";
import { loadPositiveEnvelopes, repoRoot, withTempDir, writeText } from "./segment-test-helpers.js";

test("readSegment returns envelopes in original segment order", async () => {
  await withTempDir(async (dir) => {
    const envelopes = await loadPositiveEnvelopes();
    const targetPath = path.join(dir, "synthetic_fixture-2026-04-28.jsonl");

    const result = await appendEnvelopesToSegment({
      segmentPath: targetPath,
      envelopes,
      repoRoot,
      auditTimestamp: "2026-04-28T15:00:00Z"
    });
    assert.equal(result.ok, true);

    const readBack = await readSegment(targetPath);
    assert.deepEqual(
      readBack.map((envelope) => envelope.event_id),
      envelopes.map((envelope) => envelope.event_id)
    );
  });
});

test("readSegment fails cleanly on malformed JSONL", async () => {
  await withTempDir(async (dir) => {
    const targetPath = path.join(dir, "malformed.jsonl");
    await writeText(targetPath, "{\"event_id\":\"evt_bad\"\n");

    await assert.rejects(() => readSegment(targetPath), /Invalid JSONL at line 1/);
  });
});

test("segment path helpers produce deterministic local segment paths", () => {
  assert.equal(
    segmentFileName({ source: "synthetic_fixture", capturedAt: "2026-04-28T14:00:00Z" }),
    "synthetic_fixture-2026-04-28.jsonl"
  );

  const root = path.join("tmp", "segments");
  assert.equal(
    segmentPath(root, { source: "synthetic fixture", capturedAt: "2026-04-28T14:00:00Z" }),
    path.resolve(root, "synthetic_fixture-2026-04-28.jsonl")
  );
});
