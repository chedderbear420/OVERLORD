export function paperPerformanceSummaryId(sourceLedgerFixture, sourceExitFixture, generatedAt) {
  return `pps_${sanitize(sourceLedgerFixture)}_${sanitize(sourceExitFixture)}_${sanitize(generatedAt)}`;
}

function sanitize(value) {
  return String(value ?? "unknown").replace(/[^A-Za-z0-9._:-]/g, "_");
}
