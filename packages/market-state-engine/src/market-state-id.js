export function marketStateId(sourceEventId) {
  const safeSourceEventId = String(sourceEventId ?? "unknown").replace(/[^A-Za-z0-9._:-]/g, "_");
  return `ms_${safeSourceEventId}`;
}
