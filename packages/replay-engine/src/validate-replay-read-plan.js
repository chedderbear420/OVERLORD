import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { replayReadPlanId } from "./replay-read-plan-id.js";
import { resolveLocalArtifactPath } from "./replay-artifact-reader.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "replay-engine", "fixtures", "synthetic_replay_read_plan.json");
const requiredFields = [
  "replay_read_plan_id",
  "schema_version",
  "source_replay_run_manifest_id",
  "source_manifest_path",
  "generated_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "replay_mode",
  "artifact_reads",
  "total_records_planned",
  "status",
  "reason"
];
const requiredReadFields = ["read_index", "artifact_type", "artifact_path", "record_count", "validation_command"];
const forbiddenCommandPattern = /\b(curl|wget|fetch|powershell|pwsh|invoke-webrequest|invoke-restmethod|iwr|irm)\b|https?:\/\/|[|<>]/i;
const forbiddenReplayFields = new Set([
  "execute",
  "execution_plan",
  "strategy_score",
  "strategy_name",
  "bankroll_growth",
  "bankroll_allocation",
  "roi",
  "sharpe_ratio",
  "kelly_fraction",
  "model_score",
  "recommendation",
  "recommended_action",
  "live_trade_recommendation",
  "order",
  "order_id",
  "order_request",
  "trade_request"
]);

export async function validateReplayReadPlanFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let readPlan;
  try {
    readPlan = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, (await validateReplayReadPlan(readPlan, options)).errors);
}

export async function validateReplayReadPlan(readPlan, options = {}) {
  const errors = [];
  const root = options.repoRoot ?? repoRoot;

  if (!readPlan || typeof readPlan !== "object" || Array.isArray(readPlan)) {
    return { ok: false, errors: ["ReplayReadPlan must be a JSON object"] };
  }

  validateForbiddenFields(errors, readPlan);

  for (const field of requiredFields) {
    if (!Object.hasOwn(readPlan, field)) {
      errors.push(`${field} is required`);
    }
  }
  if (readPlan.schema_version !== "replay_read_plan.v1") {
    errors.push("schema_version must be replay_read_plan.v1");
  }
  if (Number.isNaN(Date.parse(readPlan.generated_at))) {
    errors.push("generated_at must be a valid timestamp");
  }
  if (readPlan.paper_only !== true) {
    errors.push("paper_only must be true");
  }
  if (readPlan.live_execution_allowed !== false) {
    errors.push("live_execution_allowed must be false");
  }
  if (readPlan.order_placement_allowed !== false) {
    errors.push("order_placement_allowed must be false");
  }
  if (readPlan.replay_mode !== "offline_fixture_replay") {
    errors.push("replay_mode is invalid");
  }
  if (!["replay_read_plan_ready", "replay_read_plan_rejected"].includes(readPlan.status)) {
    errors.push("status is invalid");
  }
  if (!Array.isArray(readPlan.artifact_reads) || readPlan.artifact_reads.length === 0) {
    errors.push("artifact_reads must be a non-empty array");
  }
  if (!Number.isInteger(readPlan.total_records_planned) || readPlan.total_records_planned < 0) {
    errors.push("total_records_planned must be a non-negative integer");
  }
  if (readPlan.replay_read_plan_id !== replayReadPlanId(readPlan.source_replay_run_manifest_id, readPlan.artifact_reads ?? [])) {
    errors.push("replay_read_plan_id must be deterministic from source manifest and artifact reads");
  }

  await validateSafePath(errors, root, readPlan.source_manifest_path, "source_manifest_path");
  const artifactReads = Array.isArray(readPlan.artifact_reads) ? readPlan.artifact_reads : [];
  const seenPaths = new Set();
  const seenReadIndexes = new Set();
  let plannedTotal = 0;
  for (const [index, artifactRead] of artifactReads.entries()) {
    await validateArtifactRead(errors, root, artifactRead, index, seenPaths, seenReadIndexes);
    if (Number.isInteger(artifactRead.record_count) && artifactRead.record_count >= 0) {
      plannedTotal += artifactRead.record_count;
    }
  }
  if (Number.isInteger(readPlan.total_records_planned) && readPlan.total_records_planned !== plannedTotal) {
    errors.push("total_records_planned must equal the sum of artifact read counts");
  }

  return { ok: errors.length === 0, errors };
}

export function formatReplayReadPlanValidationReport(report) {
  const lines = [
    "Overlord ReplayReadPlan Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) {
    lines.push(`ERROR ${error}`);
  }
  return lines.join("\n");
}

async function validateArtifactRead(errors, root, artifactRead, index, seenPaths, seenReadIndexes) {
  if (!artifactRead || typeof artifactRead !== "object" || Array.isArray(artifactRead)) {
    errors.push("artifact_read must be an object");
    return;
  }
  for (const field of requiredReadFields) {
    if (!Object.hasOwn(artifactRead, field)) {
      errors.push(`artifact_read ${field} is required`);
    }
  }
  if (artifactRead.read_index !== index) {
    errors.push("read_index must be deterministic and contiguous");
  }
  if (seenReadIndexes.has(artifactRead.read_index)) {
    errors.push("read_index values must be unique");
  }
  seenReadIndexes.add(artifactRead.read_index);
  if (!Number.isInteger(artifactRead.record_count) || artifactRead.record_count < 0) {
    errors.push("artifact_read record_count must be a non-negative integer");
  }
  if (!isSafeLocalNpmCommand(artifactRead.validation_command)) {
    errors.push("artifact_read validation_command must be a local npm script");
  }
  if (typeof artifactRead.artifact_path === "string") {
    if (seenPaths.has(artifactRead.artifact_path)) {
      errors.push("duplicate artifact read is not allowed");
    }
    seenPaths.add(artifactRead.artifact_path);
  }
  await validateSafePath(errors, root, artifactRead.artifact_path, "artifact_path");
}

function validateForbiddenFields(errors, value, pathParts = []) {
  if (!value || typeof value !== "object") {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => validateForbiddenFields(errors, entry, [...pathParts, String(index)]));
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenReplayFields.has(key)) {
      const fieldPath = [...pathParts, key].join(".");
      errors.push(`forbidden execution, strategy, bankroll, model, or recommendation field is not allowed: ${fieldPath}`);
    }
    validateForbiddenFields(errors, nested, [...pathParts, key]);
  }
}

function isSafeLocalNpmCommand(command) {
  return typeof command === "string" && command.startsWith("npm run ") && !forbiddenCommandPattern.test(command);
}

async function validateSafePath(errors, root, artifactPath, label) {
  try {
    await resolveLocalArtifactPath(root, artifactPath);
  } catch (error) {
    errors.push(`${label} ${error.message}`);
  }
}

function makeReport(filePath, errors) {
  return {
    ok: errors.length === 0,
    filePath: path.relative(repoRoot, filePath).replaceAll("\\", "/"),
    errors
  };
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const explicitPath = process.argv.find((arg) => arg.endsWith(".json"));
  const report = await validateReplayReadPlanFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatReplayReadPlanValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
