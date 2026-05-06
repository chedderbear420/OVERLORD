import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { compareClockEvents } from "./build-replay-clock.js";
import { replayClockId } from "./replay-clock-id.js";
import { resolveLocalArtifactPath } from "./replay-artifact-reader.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "replay-engine", "fixtures", "synthetic_replay_clock.json");
const requiredFields = [
  "replay_clock_id",
  "schema_version",
  "source_replay_run_manifest_id",
  "source_manifest_path",
  "generated_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "replay_mode",
  "clock_events",
  "status",
  "reason"
];
const requiredEventFields = ["clock_index", "artifact_type", "artifact_path", "record_ref", "record_time"];

export async function validateReplayClockFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let clock;
  try {
    clock = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, (await validateReplayClock(clock, options)).errors);
}

export async function validateReplayClock(clock, options = {}) {
  const errors = [];
  const root = options.repoRoot ?? repoRoot;

  if (!clock || typeof clock !== "object" || Array.isArray(clock)) {
    return { ok: false, errors: ["ReplayClock must be a JSON object"] };
  }

  for (const field of requiredFields) {
    if (!Object.hasOwn(clock, field)) {
      errors.push(`${field} is required`);
    }
  }
  if (clock.schema_version !== "replay_clock.v1") {
    errors.push("schema_version must be replay_clock.v1");
  }
  if (Number.isNaN(Date.parse(clock.generated_at))) {
    errors.push("generated_at must be a valid timestamp");
  }
  if (clock.paper_only !== true) {
    errors.push("paper_only must be true");
  }
  if (clock.live_execution_allowed !== false) {
    errors.push("live_execution_allowed must be false");
  }
  if (clock.order_placement_allowed !== false) {
    errors.push("order_placement_allowed must be false");
  }
  if (clock.replay_mode !== "offline_fixture_replay") {
    errors.push("replay_mode is invalid");
  }
  if (!["replay_clock_ready", "replay_clock_rejected"].includes(clock.status)) {
    errors.push("status is invalid");
  }
  if (!Array.isArray(clock.clock_events) || clock.clock_events.length === 0) {
    errors.push("clock_events must be a non-empty array");
  }
  if (clock.replay_clock_id !== replayClockId(clock.source_replay_run_manifest_id, clock.clock_events ?? [])) {
    errors.push("replay_clock_id must be deterministic from source manifest and clock events");
  }

  await validateSafePath(errors, root, clock.source_manifest_path, "source_manifest_path");
  const events = Array.isArray(clock.clock_events) ? clock.clock_events : [];
  const sortedEvents = [...events].sort(compareClockEvents);

  for (const [index, event] of events.entries()) {
    await validateClockEvent(errors, event, index, sortedEvents[index], root);
  }

  return { ok: errors.length === 0, errors };
}

export function formatReplayClockValidationReport(report) {
  const lines = [
    "Overlord ReplayClock Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) {
    lines.push(`ERROR ${error}`);
  }
  return lines.join("\n");
}

async function validateClockEvent(errors, event, index, sortedEvent, root) {
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    errors.push("clock_event must be an object");
    return;
  }
  for (const field of requiredEventFields) {
    if (!Object.hasOwn(event, field)) {
      errors.push(`clock_event ${field} is required`);
    }
  }
  if (event.clock_index !== index) {
    errors.push("clock_index must be deterministic and contiguous");
  }
  if (Number.isNaN(Date.parse(event.record_time))) {
    errors.push("record_time must be a valid timestamp");
  }
  if (event.record_id !== null && event.record_id !== undefined && typeof event.record_id !== "string") {
    errors.push("record_id must be a string or null");
  }
  await validateSafePath(errors, root, event.artifact_path, "artifact_path");
  if (sortedEvent && event !== sortedEvent) {
    errors.push("clock_events must be sorted by record_time, artifact_type, and record_id or record_ref");
  }
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
  const report = await validateReplayClockFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatReplayClockValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
