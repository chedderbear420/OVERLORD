import { createHash } from "node:crypto";

export function strategyDryRunPlanId({
  strategyDefinitionId,
  strategyRunIntentId,
  strategyRunManifestId,
  strategyRunEvidenceBundleId,
  generatedAt
}) {
  const digest = createHash("sha256")
    .update([
      strategyDefinitionId,
      strategyRunIntentId,
      strategyRunManifestId,
      strategyRunEvidenceBundleId,
      generatedAt
    ].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `sdrp_${digest}`;
}
