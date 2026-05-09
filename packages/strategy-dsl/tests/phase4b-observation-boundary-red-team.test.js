import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { validateStrategyObservationProcessingContract } from "../src/validate-strategy-observation-processing-contract.js";
import { validateStrategyObservationProcessingInputSet } from "../src/validate-strategy-observation-processing-input-set.js";
import { validateStrategyObservationProcessingArtifactManifest } from "../src/validate-strategy-observation-processing-artifact-manifest.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const fixturesDir = path.join(repoRoot, "packages", "strategy-dsl", "fixtures");
const redTeamPath = path.join(fixturesDir, "negative", "phase4b_observation_boundary_red_team_cases.json");

test("Phase 4B red-team fixtures fail closed", async () => {
  const contract = await readJson(path.join(fixturesDir, "synthetic_strategy_observation_processing_contract.json"));
  const inputSet = await readJson(path.join(fixturesDir, "synthetic_strategy_observation_processing_input_set.json"));
  const manifest = await readJson(path.join(fixturesDir, "synthetic_strategy_observation_processing_artifact_manifest.json"));
  const cases = await readJson(redTeamPath);

  for (const entry of cases) {
    const candidate = clone({ contract, input_set: inputSet, manifest }[entry.target]);
    for (const mutation of entry.set ?? []) setPath(candidate, mutation.path, mutation.value);

    const report = entry.target === "contract"
      ? validateStrategyObservationProcessingContract(candidate)
      : entry.target === "input_set"
        ? await validateStrategyObservationProcessingInputSet(candidate, { repoRoot })
        : await validateStrategyObservationProcessingArtifactManifest(candidate, { repoRoot });

    assert.equal(report.ok, false, `${entry.name} should fail validation`);
    assert.ok(report.errors.length > 0, `${entry.name} should report at least one error`);
  }
});

function setPath(target, pathParts, value) {
  let cursor = target;
  for (const part of pathParts.slice(0, -1)) {
    if (!Object.hasOwn(cursor, part)) cursor[part] = typeof part === "number" ? [] : {};
    cursor = cursor[part];
  }
  cursor[pathParts.at(-1)] = value;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}
