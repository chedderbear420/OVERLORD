export function paperLedgerEntryId(actionDecisionId) {
  return `paper_${sanitize(actionDecisionId)}`;
}

function sanitize(value) {
  return String(value ?? "unknown").replace(/[^A-Za-z0-9._:-]/g, "_");
}
