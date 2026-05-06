export function paperExitId(paperLedgerEntryId, receivedAt) {
  return `exit_${sanitize(paperLedgerEntryId)}_${sanitize(receivedAt)}`;
}

function sanitize(value) {
  return String(value ?? "unknown").replace(/[^A-Za-z0-9._:-]/g, "_");
}
