import assert from "node:assert/strict";
import test from "node:test";
import { canonicalStringify, sha256Payload } from "../src/hash.js";
import { validateFixtureFile } from "../src/validate-fixtures.js";

test("canonicalStringify sorts object keys recursively", () => {
  const left = canonicalStringify({ b: 2, a: { d: 4, c: 3 } });
  const right = canonicalStringify({ a: { c: 3, d: 4 }, b: 2 });

  assert.equal(left, right);
});

test("sha256Payload returns a stable sha256-prefixed digest", () => {
  const digest = sha256Payload({ b: 2, a: 1 });

  assert.match(digest, /^sha256:[a-f0-9]{64}$/);
  assert.equal(digest, sha256Payload({ a: 1, b: 2 }));
});

test("synthetic Phase 1A fixture validates", async () => {
  const report = await validateFixtureFile();

  assert.deepEqual(report.errors, []);
  assert.equal(report.ok, true);
  assert.equal(report.records, 4);
});
