import { createHash } from "node:crypto";

export function replayEvidenceBundleId({ manifestId, clockId, readPlanId, traceCount, summaryId }) {
  const digest = createHash("sha256")
    .update([manifestId, clockId, readPlanId, traceCount, summaryId].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `reb_${digest}`;
}
