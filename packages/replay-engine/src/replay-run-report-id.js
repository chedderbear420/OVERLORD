import { createHash } from "node:crypto";

export function replayRunReportId({ evidenceBundleId, totalTraceRecords, totalRecordsRead, totalArtifactsRead }) {
  const digest = createHash("sha256")
    .update([evidenceBundleId, totalTraceRecords, totalRecordsRead, totalArtifactsRead].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `rrr_${digest}`;
}
