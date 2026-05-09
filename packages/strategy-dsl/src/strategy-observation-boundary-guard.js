import path from "node:path";
import { lstat, realpath, stat } from "node:fs/promises";

export const observationValidationReasonCodes = Object.freeze({
  ERR_FORBIDDEN_KEY_DETECTED: "ERR_FORBIDDEN_KEY_DETECTED",
  ERR_FORBIDDEN_VALUE_DETECTED: "ERR_FORBIDDEN_VALUE_DETECTED",
  ERR_UNSAFE_PATH_DETECTED: "ERR_UNSAFE_PATH_DETECTED",
  ERR_UNKNOWN_FIELD: "ERR_UNKNOWN_FIELD",
  ERR_REASON_TEXT_UNSAFE: "ERR_REASON_TEXT_UNSAFE",
  ERR_SOURCE_MISMATCH: "ERR_SOURCE_MISMATCH",
  ERR_RECORD_COUNT_MISMATCH: "ERR_RECORD_COUNT_MISMATCH",
  ERR_HASH_MISMATCH: "ERR_HASH_MISMATCH",
  VALIDATION_PASSED: "VALIDATION_PASSED"
});

export const approvedStrategyDslArtifactRoot = path.join("packages", "strategy-dsl", "fixtures");

const allowedSafetyFlagKeys = new Set([
  "live_execution_allowed",
  "order_placement_allowed"
]);

const forbiddenKeyConcepts = [
  "buy",
  "sell",
  "hold",
  "trade",
  "order",
  "execution",
  "signal",
  "recommendation",
  "recommended_action",
  "decision",
  "bankroll",
  "position_size",
  "edge",
  "confidence",
  "expected_value",
  "probability",
  "opportunity",
  "undervalued",
  "overvalued",
  "entry",
  "exit",
  "trigger",
  "api_key",
  "credential",
  "secret",
  "token",
  ".env",
  "websocket",
  "socket",
  "stream",
  "subscription",
  "polling",
  "live_config",
  "live_endpoint"
];

const forbiddenStringPatterns = [
  /\bbuy\b/iu,
  /\bsell\b/iu,
  /\bhold\b/iu,
  /\btrade\b/iu,
  /\border\b/iu,
  /\bexecution\b/iu,
  /\bsignal\b/iu,
  /\brecommendation\b/iu,
  /\brecommended_action\b/iu,
  /\bdecision\b/iu,
  /\bbankroll\b/iu,
  /\bposition_size\b/iu,
  /\bedge\b/iu,
  /\bconfidence\b/iu,
  /\bexpected_value\b/iu,
  /\bprobability\b/iu,
  /\bopportunity\b/iu,
  /\bundervalued\b/iu,
  /\bovervalued\b/iu,
  /\bentry\b/iu,
  /\bexit\b/iu,
  /\btrigger\b/iu,
  /\bapi_key\b/iu,
  /\bcredential\b/iu,
  /\bsecret\b/iu,
  /\btoken\b/iu,
  /\.env/iu,
  /\bwebsocket\b/iu,
  /\bsocket\b/iu,
  /\bstream\b/iu,
  /\bsubscription\b/iu,
  /\bpolling\b/iu,
  /\bapi\s*fetch\b/iu,
  /\blive\s*api\b/iu,
  /\blive\s*config\b/iu,
  /\blive\s*market\b/iu,
  /\blive\s*endpoint\b/iu,
  /\blive\s*execution\s*enabled\b/iu,
  /\bkalshi\s+(api|token|secret|credential|live|endpoint)/iu
];

const forbiddenPathPattern = /(^|[\\/])(\.env|env|credentials?|secrets?|api[_-]?keys?|live[_-]?config|tokens?|bearer|private[_-]?keys?)([\\/]|\.|$)/iu;
const urlPattern = /^[a-z][a-z0-9+.-]*:\/\//iu;

export function validateObservationBoundary(value, options = {}) {
  const errors = [];
  const scanStringValues = options.scanStringValues !== false;
  const rootPath = options.pathParts ?? [];

  inspectBoundaryValue(errors, value, rootPath, { scanStringValues });
  return makeBoundaryReport(errors);
}

export function makeBoundaryReport(errors) {
  return {
    ok: errors.length === 0,
    reason_code: errors.length === 0 ? observationValidationReasonCodes.VALIDATION_PASSED : errors[0].reason_code,
    errors
  };
}

export function validateNoUnknownFields(errors, value, allowedFields, label = "object") {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const allowedSet = new Set(allowedFields);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) {
      errors.push(makeBoundaryError(
        observationValidationReasonCodes.ERR_UNKNOWN_FIELD,
        `${label} contains unknown field: ${key}`,
        key
      ));
    }
  }
}

export async function validateSafeStrategyDslArtifactPath(errors, repoRoot, artifactPath, label = "artifact_path") {
  if (typeof artifactPath !== "string" || artifactPath.length === 0) {
    errors.push(makeBoundaryError(observationValidationReasonCodes.ERR_UNSAFE_PATH_DETECTED, `${label} must be a non-empty string`, label));
    return null;
  }
  if (path.isAbsolute(artifactPath)) {
    errors.push(makeBoundaryError(observationValidationReasonCodes.ERR_UNSAFE_PATH_DETECTED, `${label} must be relative`, label));
    return null;
  }
  if (urlPattern.test(artifactPath)) {
    errors.push(makeBoundaryError(observationValidationReasonCodes.ERR_UNSAFE_PATH_DETECTED, `${label} must not be a URL`, label));
    return null;
  }
  if (artifactPath.includes("..")) {
    errors.push(makeBoundaryError(observationValidationReasonCodes.ERR_UNSAFE_PATH_DETECTED, `${label} must not contain path traversal`, label));
    return null;
  }
  if (forbiddenPathPattern.test(artifactPath)) {
    errors.push(makeBoundaryError(observationValidationReasonCodes.ERR_UNSAFE_PATH_DETECTED, `${label} must not reference credentials, secrets, env, live config, API keys, or tokens`, label));
    return null;
  }
  if (!artifactPath.startsWith(approvedStrategyDslArtifactRoot.replaceAll("\\", "/") + "/")) {
    errors.push(makeBoundaryError(observationValidationReasonCodes.ERR_UNSAFE_PATH_DETECTED, `${label} must stay inside ${approvedStrategyDslArtifactRoot.replaceAll("\\", "/")}`, label));
    return null;
  }

  const root = await realpath(path.resolve(repoRoot, approvedStrategyDslArtifactRoot));
  const resolved = path.resolve(repoRoot, artifactPath);
  let artifactStat;
  try {
    artifactStat = await lstat(resolved);
  } catch (error) {
    errors.push(makeBoundaryError(observationValidationReasonCodes.ERR_UNSAFE_PATH_DETECTED, `${label} could not be read: ${error.message}`, label));
    return null;
  }
  if (artifactStat.isSymbolicLink()) {
    errors.push(makeBoundaryError(observationValidationReasonCodes.ERR_UNSAFE_PATH_DETECTED, `${label} must not be a symlink`, label));
    return null;
  }

  const real = await realpath(resolved);
  if (!real.startsWith(root + path.sep) && real !== root) {
    errors.push(makeBoundaryError(observationValidationReasonCodes.ERR_UNSAFE_PATH_DETECTED, `${label} must resolve inside ${approvedStrategyDslArtifactRoot.replaceAll("\\", "/")}`, label));
    return null;
  }
  await stat(real);
  return real;
}

export function makeBoundaryError(reasonCode, message, fieldPath) {
  return {
    reason_code: reasonCode,
    field_path: fieldPath,
    message
  };
}

function inspectBoundaryValue(errors, value, pathParts, options) {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => inspectBoundaryValue(errors, entry, [...pathParts, String(index)], options));
    return;
  }
  if (typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      const nextPath = [...pathParts, key];
      if (isForbiddenBoundaryKey(key, nested)) {
        errors.push(makeBoundaryError(
          observationValidationReasonCodes.ERR_FORBIDDEN_KEY_DETECTED,
          `forbidden boundary key detected: ${nextPath.join(".")}`,
          nextPath.join(".")
        ));
      }
      inspectBoundaryValue(errors, nested, nextPath, options);
    }
    return;
  }
  if (options.scanStringValues && typeof value === "string" && shouldScanStringPath(pathParts) && isForbiddenBoundaryString(value)) {
    const reasonCode = pathParts.at(-1) === "reason"
      ? observationValidationReasonCodes.ERR_REASON_TEXT_UNSAFE
      : observationValidationReasonCodes.ERR_FORBIDDEN_VALUE_DETECTED;
    errors.push(makeBoundaryError(
      reasonCode,
      `forbidden boundary value detected: ${pathParts.join(".")}`,
      pathParts.join(".")
    ));
  }
}

function shouldScanStringPath(pathParts) {
  return !pathParts.includes("forbidden_processing_outputs");
}

function isForbiddenBoundaryKey(key, value) {
  if (allowedSafetyFlagKeys.has(key) && value === false) return false;
  const normalized = key.toLowerCase();
  return forbiddenKeyConcepts.some((concept) => normalized === concept || normalized.includes(concept));
}

function isForbiddenBoundaryString(value) {
  return forbiddenStringPatterns.some((pattern) => pattern.test(value));
}
