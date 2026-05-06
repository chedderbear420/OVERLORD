import { createHash } from "node:crypto";

export function strategyRunIntentId({ strategyDefinitionId, replayEvidenceBundleId, replayRunManifestId, runMode }) {
  const digest = createHash("sha256")
    .update([strategyDefinitionId, replayEvidenceBundleId, replayRunManifestId, runMode].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `sri_${digest}`;
}
