import { createHash } from "node:crypto";

export function strategyRunEvidenceBundleId({ strategyRunManifestId, strategyDefinitionId, strategyRunIntentId, traceCount, summaryId }) {
  const digest = createHash("sha256")
    .update([strategyRunManifestId, strategyDefinitionId, strategyRunIntentId, traceCount, summaryId].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `sreb_${digest}`;
}
